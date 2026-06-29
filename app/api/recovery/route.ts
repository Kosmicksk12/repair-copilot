import { NextResponse } from "next/server";
import { getCustomerRecoveryDashboard } from "@/lib/customer-recovery";

export function GET() {
  return NextResponse.json(getCustomerRecoveryDashboard());
}
