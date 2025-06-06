
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChartIcon } from 'lucide-react';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts';
import type { Trip, Expense, Member } from '@/lib/types/trip';

interface TripOverviewTabProps {
  trip: Trip;
  expenses: Expense[] | undefined;
  members: Member[] | undefined;
  currentUser: FirebaseUser | null;
}

export default function TripOverviewTab({ trip, expenses, members, currentUser }: TripOverviewTabProps) {
  const displayCurrencySymbol = trip.baseCurrency === 'INR' ? '₹' : trip.baseCurrency;
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const yourSpending = expenses?.filter(exp => exp.paidBy === currentUser?.uid).reduce((sum, exp) => sum + exp.amount, 0) || 0;

  const getMemberName = useCallback((uid: string) => members?.find(m => m.id === uid)?.displayName || uid.substring(0, 6) + "...", [members]);

  const categoryData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).map(([category, amount]) => ({ category, amount, fill: '' })).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const categoryChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    categoryData.forEach((item, index) => {
      config[item.category] = {
        label: item.category,
        color: `hsl(var(--chart-${index % 5 + 1}))`,
      };
      const categoryItem = categoryData.find(cd => cd.category === item.category);
      if (categoryItem) {
        categoryItem.fill = `hsl(var(--chart-${index % 5 + 1}))`;
      }
    });
    return config;
  }, [categoryData]);

  const memberSpendingData = useMemo(() => {
    if (!expenses || expenses.length === 0 || !members || members.length === 0) return [];
    const spending = expenses.reduce((acc, curr) => {
      acc[curr.paidBy] = (acc[curr.paidBy] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(spending).map(([memberId, amount]) => ({
      name: getMemberName(memberId),
      amount,
      fill: 'hsl(var(--chart-1))'
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses, members, getMemberName]);

  const memberSpendingChartConfig = {
    amount: { label: "Amount Spent", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Trip Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Total Trip Expenses</h3>
            <p className="text-2xl font-bold">{displayCurrencySymbol}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">Your Spending (Paid by You)</h3>
            <p className="text-2xl font-bold">{displayCurrencySymbol}{yourSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </CardContent>
      </Card>

      {expenses && expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ChartContainer config={categoryChartConfig} className="min-h-[250px] w-full aspect-square">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="category" hideLabel />} />
                    <Pie data={categoryData} dataKey="amount" nameKey="category" labelLine={false} label={({ percent, name }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || `hsl(var(--chart-${index % 5 + 1}))`} />
                      ))}
                    </Pie>
                    <RechartsLegend content={({ payload }) => <ChartLegendContent payload={payload} config={categoryChartConfig} />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No category data to display.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Spending per Member</CardTitle>
            </CardHeader>
            <CardContent>
              {memberSpendingData.length > 0 ? (
                <ChartContainer config={memberSpendingChartConfig} className="min-h-[250px] w-full">
                  <BarChart data={memberSpendingData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `${displayCurrencySymbol}${value}`} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={100} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" hideLabel />} />
                    <Bar dataKey="amount" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-muted-foreground text-center py-10">No member spending data to display.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{trip.description || "No description provided for this trip."}</p>
        </CardContent>
      </Card>
    </div>
  );
}
