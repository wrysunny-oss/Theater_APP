import assert from "node:assert/strict";
import test from "node:test";
import { batchResultsSchema, createBatchSchema } from "./withdrawal.schema.js";
import { deriveBatchStatus } from "./withdrawal.service.js";

const firstId = "00000000-0000-4000-8000-000000000001";
const secondId = "00000000-0000-4000-8000-000000000002";

test("创建批次拒绝重复提现订单", () => {
  assert.equal(createBatchSchema.safeParse({ requestId: "request-001", withdrawalIds: [firstId, firstId] }).success, false);
});
test("成功结果必须携带支付流水号", () => {
  assert.equal(batchResultsSchema.safeParse({ requestId: "result-001", rows: [{ withdrawalId: firstId, success: true }] }).success, false);
});
test("失败结果必须携带失败原因", () => {
  assert.equal(batchResultsSchema.safeParse({ requestId: "result-002", rows: [{ withdrawalId: firstId, success: false }] }).success, false);
});
test("结果文件拒绝重复订单", () => {
  const row = { withdrawalId: firstId, success: true, paymentReference: "pay-1" };
  assert.equal(batchResultsSchema.safeParse({ requestId: "result-003", rows: [row, row] }).success, false);
});
test("批次状态正确区分全部成功和部分失败", () => {
  assert.equal(deriveBatchStatus([{ withdrawalId: firstId, success: true, paymentReference: "pay-1" }, { withdrawalId: secondId, success: true, paymentReference: "pay-2" }]), "COMPLETED");
  assert.equal(deriveBatchStatus([{ withdrawalId: firstId, success: false, failureReason: "账户无效" }]), "PARTIAL");
});
