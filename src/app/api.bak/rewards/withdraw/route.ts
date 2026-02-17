import { NextRequest, NextResponse } from "next/server";
import { RewardTransaction } from "@/types/mapper";

// In-memory storage for MVP (replace with database in production)
const transactions: Map<string, RewardTransaction> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { mapperId, amount, bankAccount } = await request.json();

    if (!mapperId || !amount || !bankAccount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create transaction object
    const transaction: RewardTransaction = {
      id: transactionId,
      mapperId,
      sessionId: "", // Not tied to specific session for withdrawals
      amount,
      type: "WITHDRAWAL",
      status: "PENDING",
      timestamp: new Date().toISOString(),
      metadata: {
        bankAccount,
        amountNGN: amount * 100, // 1 token = 100 NGN
      },
    };

    // Store transaction
    transactions.set(transactionId, transaction);

    // In production, you would:
    // 1. Verify the mapper has sufficient balance
    // 2. Integrate with payment provider (Paystack, Flutterwave, etc.)
    // 3. Process the actual bank transfer
    // 4. Update transaction status to COMPLETED or FAILED

    // Simulate processing delay
    setTimeout(() => {
      transaction.status = "COMPLETED";
      transactions.set(transactionId, transaction);
    }, 3000);

    return NextResponse.json(
      {
        transaction,
        message: "Withdrawal initiated successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mapperId = searchParams.get("mapperId");

    let filteredTransactions = Array.from(transactions.values());

    if (mapperId) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.mapperId === mapperId
      );
    }

    // Sort by timestamp (most recent first)
    filteredTransactions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      transactions: filteredTransactions,
      total: filteredTransactions.length,
    });
  } catch (error) {
    console.error("Transactions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// Export storage for other API routes
export { transactions };
