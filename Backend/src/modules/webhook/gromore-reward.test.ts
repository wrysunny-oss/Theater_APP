import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { groMoreEcpmToRevenueYuan, verifyGroMoreSign } from "./webhook.service.js";

test("GroMore m-key 与交易号签名校验", () => {
  const key = "test-gromore-security-key";
  const transId = "transaction-001";
  const sign = createHash("sha256").update(`${key}:${transId}`).digest("hex");
  assert.equal(verifyGroMoreSign(transId, sign, key), true);
  assert.equal(verifyGroMoreSign("tampered", sign, key), false);
});

test("GroMore eCPM 从分每千次换算为单次人民币收入", () => {
  assert.equal(groMoreEcpmToRevenueYuan("100"), "0.001000");
  assert.equal(groMoreEcpmToRevenueYuan("123.45"), "0.001234");
  assert.equal(groMoreEcpmToRevenueYuan("0"), "0.000000");
});
