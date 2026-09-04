import test from "node:test";
import assert from "node:assert/strict";
import { calculateAdDistribution } from "./admin.service.js";

test("无上级时用户获得全部基础应分金币", () => {
  assert.deepEqual(calculateAdDistribution({ revenueMicros: 10_000n, coinsPerCent: 100, userRateBps: 5000, directRateBps: 2000, indirectRateBps: 1000, hasDirect: false, hasIndirect: false }), { baseUserCoins: 50n, awardedCoins: 50n, directAwardedCoins: 0n, indirectAwardedCoins: 0n });
});
test("存在两级上级时基础收益完整拆分", () => {
  const result = calculateAdDistribution({ revenueMicros: 1_000_000n, coinsPerCent: 100, userRateBps: 5000, directRateBps: 2000, indirectRateBps: 1000, hasDirect: true, hasIndirect: true });
  assert.deepEqual(result, { baseUserCoins: 5000n, awardedCoins: 3500n, directAwardedCoins: 1000n, indirectAwardedCoins: 500n });
  assert.equal(result.awardedCoins + result.directAwardedCoins + result.indirectAwardedCoins, result.baseUserCoins);
});
test("只有直属上级时不扣间推返佣", () => {
  assert.deepEqual(calculateAdDistribution({ revenueMicros: 1_000_000n, coinsPerCent: 100, userRateBps: 5000, directRateBps: 2000, indirectRateBps: 1000, hasDirect: true, hasIndirect: false }), { baseUserCoins: 5000n, awardedCoins: 4000n, directAwardedCoins: 1000n, indirectAwardedCoins: 0n });
});
test("小额收益始终向下取整且不会超发", () => {
  const result = calculateAdDistribution({ revenueMicros: 1n, coinsPerCent: 100, userRateBps: 5000, directRateBps: 2000, indirectRateBps: 1000, hasDirect: true, hasIndirect: true });
  assert.equal(result.baseUserCoins, 0n); assert.equal(result.awardedCoins, 0n);
});
