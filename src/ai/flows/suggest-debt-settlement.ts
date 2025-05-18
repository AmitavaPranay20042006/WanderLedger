'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal debt settlements among travelers.
 *
 * - suggestDebtSettlement - A function that takes expense data and suggests how to settle debts.
 * - SuggestDebtSettlementInput - The input type for the suggestDebtSettlement function.
 * - SuggestDebtSettlementOutput - The return type for the suggestDebtSettlement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDebtSettlementInputSchema = z.object({
  expenses: z
    .array(
      z.object({
        payer: z.string().describe('The user ID of the person who paid.'),
        amount: z.number().describe('The amount paid.'),
        currency: z.string().describe('The currency of the payment.'),
        participants: z
          .array(z.string())
          .describe('The user IDs of those who participated in the expense.'),
      })
    )
    .describe('An array of expenses for the trip.'),
  members: z
    .array(z.string())
    .describe('The user IDs of all members in the trip.'),
});
export type SuggestDebtSettlementInput = z.infer<
  typeof SuggestDebtSettlementInputSchema
>;

const SuggestDebtSettlementOutputSchema = z.object({
  settlementPlan: z
    .array(
      z.object({
        from: z.string().describe('The user ID of the person paying.'),
        to: z.string().describe('The user ID of the person receiving payment.'),
        amount: z.number().describe('The amount to be paid.'),
        currency: z.string().describe('The currency of the payment.'),
      })
    )
    .describe('An array of suggested transactions to settle debts.'),
});
export type SuggestDebtSettlementOutput = z.infer<
  typeof SuggestDebtSettlementOutputSchema
>;

export async function suggestDebtSettlement(
  input: SuggestDebtSettlementInput
): Promise<SuggestDebtSettlementOutput> {
  return suggestDebtSettlementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDebtSettlementPrompt',
  input: {schema: SuggestDebtSettlementInputSchema},
  output: {schema: SuggestDebtSettlementOutputSchema},
  prompt: `You are an AI assistant that helps settle debts among travelers.

Given a list of expenses, determine the simplest way for travelers to settle their debts, minimizing the number of transactions.

Expenses:
{{#each expenses}}
- Payer: {{this.payer}}, Amount: {{this.amount}} {{this.currency}}, Participants: {{this.participants}}
{{/each}}

Members:
{{#each members}}
- {{this}}
{{/each}}

Suggest a settlement plan with the fewest number of transactions. Return a JSON object representing the settlement plan.

Output format:{
  settlementPlan: [
    {
      from: "payer_user_id",
      to: "receiver_user_id",
      amount: amount,
      currency: "currency"
    }
  ]
}

Ensure the output is a valid JSON object.`,
});

const suggestDebtSettlementFlow = ai.defineFlow(
  {
    name: 'suggestDebtSettlementFlow',
    inputSchema: SuggestDebtSettlementInputSchema,
    outputSchema: SuggestDebtSettlementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
