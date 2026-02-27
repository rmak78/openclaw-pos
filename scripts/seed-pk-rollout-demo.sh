#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://pos-api.bixisoft.com/v1}"
API_KEY="${API_KEY:-${OPENCLAW_API_KEY:-}}"
RUN_TAG="${RUN_TAG:-$(date +%Y%m%d%H%M%S)}"

header_args=("-H" "content-type: application/json")
if [[ -n "$API_KEY" ]]; then
  header_args+=("-H" "x-api-key: ${API_KEY}")
fi

json_print() {
  if command -v jq >/dev/null 2>&1; then
    jq .
  else
    cat
  fi
}

post() {
  local endpoint="$1"
  local payload="$2"
  local label="$3"

  echo
  echo ">>> ${label}"
  local resp
  resp=$(curl -sS -X POST "${BASE_URL}${endpoint}" "${header_args[@]}" -d "$payload")
  echo "$resp" | json_print

  if ! echo "$resp" | grep -q '"ok": true'; then
    echo "ERROR: ${label} failed" >&2
    exit 1
  fi
}

get() {
  local endpoint="$1"
  local label="$2"

  echo
  echo ">>> ${label}"
  curl -sS "${BASE_URL}${endpoint}" | json_print
}

echo "Running Pakistan rollout demo seed against: ${BASE_URL}"
echo "Run tag: ${RUN_TAG}"

# 0) Baseline branch scaffold from existing endpoint
post "/seed/demo-branch" "{}" "Baseline demo branch (Karachi)"

# 1) Add two more branches + tills to simulate rollout
post "/org-units" "{
  \"id\": \"demo-branch-lhe-${RUN_TAG}\",
  \"parent_id\": \"demo-ho-pk\",
  \"unit_type\": \"branch\",
  \"code\": \"LHE-01\",
  \"name\": \"Lahore Gulberg Branch\",
  \"country_code\": \"PK\",
  \"currency_code\": \"PKR\"
}" "Create Lahore branch"

post "/org-units" "{
  \"id\": \"demo-branch-isb-${RUN_TAG}\",
  \"parent_id\": \"demo-ho-pk\",
  \"unit_type\": \"branch\",
  \"code\": \"ISB-01\",
  \"name\": \"Islamabad F-7 Branch\",
  \"country_code\": \"PK\",
  \"currency_code\": \"PKR\"
}" "Create Islamabad branch"

post "/org-units" "{
  \"id\": \"demo-till-lhe-01-${RUN_TAG}\",
  \"parent_id\": \"demo-branch-lhe-${RUN_TAG}\",
  \"unit_type\": \"till\",
  \"code\": \"LHE-01-T1\",
  \"name\": \"Lahore Till 1\",
  \"country_code\": \"PK\",
  \"currency_code\": \"PKR\"
}" "Create Lahore Till 1"

post "/org-units" "{
  \"id\": \"demo-till-lhe-02-${RUN_TAG}\",
  \"parent_id\": \"demo-branch-lhe-${RUN_TAG}\",
  \"unit_type\": \"till\",
  \"code\": \"LHE-01-T2\",
  \"name\": \"Lahore Till 2\",
  \"country_code\": \"PK\",
  \"currency_code\": \"PKR\"
}" "Create Lahore Till 2"

post "/org-units" "{
  \"id\": \"demo-till-isb-01-${RUN_TAG}\",
  \"parent_id\": \"demo-branch-isb-${RUN_TAG}\",
  \"unit_type\": \"till\",
  \"code\": \"ISB-01-T1\",
  \"name\": \"Islamabad Till 1\",
  \"country_code\": \"PK\",
  \"currency_code\": \"PKR\"
}" "Create Islamabad Till 1"

# 2) Returns scenario: sell then return + refund
post "/sales-receipts" "{
  \"id\": \"demo-sale-khi-${RUN_TAG}\",
  \"receipt_no\": \"KHI-SALE-${RUN_TAG}\",
  \"branch_id\": \"demo-branch-khi-01\",
  \"till_id\": \"demo-till-khi-01\",
  \"currency_code\": \"PKR\",
  \"subtotal_amount\": 240,
  \"tax_amount\": 36.6,
  \"total_amount\": 240,
  \"business_date\": \"2026-02-27\"
}" "Create Karachi sales receipt"

post "/sales-receipt-lines" "{
  \"id\": \"demo-sale-line-khi-${RUN_TAG}\",
  \"sales_receipt_id\": \"demo-sale-khi-${RUN_TAG}\",
  \"sku_code\": \"TEA-CHAI-001\",
  \"item_name\": \"Tea / Chai Cup\",
  \"quantity\": 2,
  \"unit_price\": 120,
  \"line_total\": 240
}" "Add receipt line"

post "/sales-receipt-payments" "{
  \"id\": \"demo-sale-pay-khi-${RUN_TAG}\",
  \"sales_receipt_id\": \"demo-sale-khi-${RUN_TAG}\",
  \"payment_method_id\": \"demo-pay-cash\",
  \"amount\": 240,
  \"settlement_status\": \"captured\"
}" "Capture payment"

post "/sales-returns" "{
  \"id\": \"demo-return-khi-${RUN_TAG}\",
  \"return_no\": \"KHI-RET-${RUN_TAG}\",
  \"original_sales_receipt_id\": \"demo-sale-khi-${RUN_TAG}\",
  \"branch_id\": \"demo-branch-khi-01\",
  \"currency_code\": \"PKR\",
  \"return_reason\": \"Damaged cup leak\",
  \"return_status\": \"approved\",
  \"total_amount\": 120,
  \"business_date\": \"2026-02-27\"
}" "Create return header"

post "/sales-return-lines" "{
  \"id\": \"demo-return-line-khi-${RUN_TAG}\",
  \"sales_return_id\": \"demo-return-khi-${RUN_TAG}\",
  \"original_sales_receipt_line_id\": \"demo-sale-line-khi-${RUN_TAG}\",
  \"sku_code\": \"TEA-CHAI-001\",
  \"item_name\": \"Tea / Chai Cup\",
  \"quantity\": 1,
  \"unit_price\": 120,
  \"line_total\": 120,
  \"restock_to_inventory\": 1
}" "Post return line and inventory reversal"

post "/sales-refunds" "{
  \"id\": \"demo-refund-khi-${RUN_TAG}\",
  \"sales_return_id\": \"demo-return-khi-${RUN_TAG}\",
  \"payment_method_id\": \"demo-pay-cash\",
  \"amount\": 120,
  \"refund_status\": \"processed\"
}" "Post cash refund"

# 3) Procurement scenario: supplier -> PO -> transition -> goods receipt
post "/suppliers" "{
  \"id\": \"demo-supplier-pk-${RUN_TAG}\",
  \"supplier_code\": \"PK-CHAI-MILL\",
  \"supplier_name\": \"Punjab Chai Processors\",
  \"country_code\": \"PK\",
  \"payment_terms_days\": 15,
  \"status\": \"active\"
}" "Create supplier"

post "/purchase-orders" "{
  \"id\": \"demo-po-lhe-${RUN_TAG}\",
  \"po_number\": \"LHE-PO-${RUN_TAG}\",
  \"supplier_id\": \"demo-supplier-pk-${RUN_TAG}\",
  \"branch_id\": \"demo-branch-lhe-${RUN_TAG}\",
  \"order_date\": \"2026-02-27\",
  \"expected_date\": \"2026-03-01\",
  \"currency_code\": \"PKR\",
  \"status\": \"draft\",
  \"lines\": [
    {
      \"id\": \"demo-po-line-lhe-${RUN_TAG}\",
      \"sku_code\": \"TEA-CHAI-001\",
      \"item_name\": \"Tea / Chai Cup\",
      \"ordered_qty\": 150,
      \"unit_cost\": 72,
      \"tax_rate\": 0.18
    }
  ]
}" "Create purchase order"

post "/purchase-orders/transition" "{
  \"purchase_order_id\": \"demo-po-lhe-${RUN_TAG}\",
  \"to_status\": \"submitted\",
  \"transition_note\": \"Approved by area manager\"
}" "Transition PO to submitted"

post "/goods-receipts" "{
  \"id\": \"demo-grn-lhe-${RUN_TAG}\",
  \"grn_number\": \"LHE-GRN-${RUN_TAG}\",
  \"purchase_order_id\": \"demo-po-lhe-${RUN_TAG}\",
  \"supplier_id\": \"demo-supplier-pk-${RUN_TAG}\",
  \"branch_id\": \"demo-branch-lhe-${RUN_TAG}\",
  \"received_at\": \"2026-03-01T10:15:00Z\",
  \"status\": \"posted\",
  \"lines\": [
    {
      \"id\": \"demo-grn-line-lhe-${RUN_TAG}\",
      \"purchase_order_line_id\": \"demo-po-line-lhe-${RUN_TAG}\",
      \"sku_code\": \"TEA-CHAI-001\",
      \"received_qty\": 150,
      \"accepted_qty\": 148,
      \"rejected_qty\": 2,
      \"unit_cost\": 72
    }
  ]
}" "Post goods receipt and inventory increment"

# 4) Payroll sample run across branches
post "/pay-cycles" "{
  \"id\": \"demo-cycle-pk-${RUN_TAG}\",
  \"cycle_code\": \"PK-MONTHLY-2026-02\",
  \"country_code\": \"PK\",
  \"cycle_type\": \"monthly\",
  \"cycle_start\": \"2026-02-01\",
  \"cycle_end\": \"2026-02-28\",
  \"payday\": \"2026-03-03\",
  \"status\": \"open\"
}" "Create pay cycle"

post "/pay-components" "{
  \"id\": \"demo-pay-basic-${RUN_TAG}\",
  \"component_code\": \"BASIC\",
  \"component_name\": \"Basic Salary\",
  \"component_type\": \"earning\",
  \"calc_mode\": \"fixed\",
  \"taxable_default\": 1
}" "Create pay component: basic salary"

post "/pay-components" "{
  \"id\": \"demo-pay-allow-${RUN_TAG}\",
  \"component_code\": \"CONV_ALLOW\",
  \"component_name\": \"Conveyance Allowance\",
  \"component_type\": \"earning\",
  \"calc_mode\": \"fixed\",
  \"taxable_default\": 0
}" "Create pay component: conveyance allowance"

post "/payroll-runs" "{
  \"id\": \"demo-payrun-khi-${RUN_TAG}\",
  \"pay_cycle_id\": \"demo-cycle-pk-${RUN_TAG}\",
  \"branch_id\": \"demo-branch-khi-01\",
  \"run_code\": \"PK-KHI-RUN-${RUN_TAG}\",
  \"run_type\": \"regular\",
  \"status\": \"draft\",
  \"notes\": \"Karachi pilot payroll\"
}" "Create payroll run: Karachi"

post "/payroll-runs" "{
  \"id\": \"demo-payrun-lhe-${RUN_TAG}\",
  \"pay_cycle_id\": \"demo-cycle-pk-${RUN_TAG}\",
  \"branch_id\": \"demo-branch-lhe-${RUN_TAG}\",
  \"run_code\": \"PK-LHE-RUN-${RUN_TAG}\",
  \"run_type\": \"regular\",
  \"status\": \"draft\",
  \"notes\": \"Lahore rollout payroll\"
}" "Create payroll run: Lahore"

# 5) Optional quick summaries
get "/purchase-orders/summary" "PO status summary"
get "/day-close-summary?branch_id=demo-branch-khi-01&business_date=2026-02-27" "Karachi day-close summary"

echo
echo "✅ Pakistan rollout demo seed completed"
echo "Scenarios covered: multi-branch+tills, returns/refunds, procurement, payroll runs"
echo "Run tag: ${RUN_TAG}"
