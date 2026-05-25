import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type Database from 'better-sqlite3';
import type { UserConfig } from '../types.js';
import { getActiveExam, abandonExam } from '../db/exam-attempts.js';
import { ensureUser } from '../db/users.js';

export function registerAbandonExam(server: McpServer, db: Database.Database, userConfig: UserConfig): void {
  server.tool(
    'abandon_exam',
    'Abandon the current in-progress practice exam so you can start a new one. The exam is marked complete without a score. Your study progress and mastery data are not affected.',
    { confirmed: z.boolean().describe('Must be true to confirm abandoning the exam') },
    async ({ confirmed }) => {
      if (!confirmed) {
        return { content: [{ type: 'text' as const, text: 'Abandon cancelled. Your exam is still in progress.' }] };
      }

      const userId = userConfig.userId;
      ensureUser(db, userId);

      const active = getActiveExam(db, userId);
      if (!active) {
        return { content: [{ type: 'text' as const, text: 'No active exam found. Use start_practice_exam to begin a new one.' }] };
      }

      const abandoned = abandonExam(db, active.id);
      if (!abandoned) {
        return { content: [{ type: 'text' as const, text: 'Failed to abandon exam. Please try again.' }], isError: true };
      }

      const answered = active.answeredQuestionIds.length;
      const total = active.totalQuestions;

      return {
        content: [{
          type: 'text' as const,
          text: [
            `Exam abandoned (${answered}/${total} questions answered).`,
            'Your study progress and mastery data are unchanged.',
            'Use start_practice_exam to begin a new exam.',
          ].join('\n'),
        }],
      };
    }
  );
}
