import test from "node:test";
import assert from "node:assert/strict";
import { calculateDeviceRiskScore, distanceInMeters } from "./safety.service.js";

const healthy = { challengeId:"00000000-0000-4000-8000-000000000000",deviceId:"device-test-001",simStatus:'PASS' as const,wechatStatus:'PASS' as const,douyinStatus:'PASS' as const,alipayStatus:'PASS' as const,emulatorStatus:'PASS' as const,cloudDeviceStatus:'PASS' as const,scriptStatus:'PASS' as const,networkStatus:'PASS' as const,ipStatus:'PASS' as const,location:{latitude:31.2304,longitude:121.4737,referenceLatitude:31.2304,referenceLongitude:121.4737,maxDistanceMeters:50_000} };

test("十项健康检测得到 100 分",()=>assert.equal(calculateDeviceRiskScore(healthy).score,100));
test("五项风险得到 50 分并满足自动封号阈值",()=>{const result=calculateDeviceRiskScore({...healthy,simStatus:'RISK',wechatStatus:'RISK',douyinStatus:'RISK',alipayStatus:'RISK',emulatorStatus:'RISK'});assert.equal(result.score,50);assert.equal(result.score<60,true);});
test("60 分边界不自动封号",()=>{const result=calculateDeviceRiskScore({...healthy,simStatus:'RISK',wechatStatus:'RISK',douyinStatus:'RISK',alipayStatus:'RISK'});assert.equal(result.score,60);assert.equal(result.score<60,false);});
test("未知项不扣分但降低判定可信度",()=>{const result=calculateDeviceRiskScore({...healthy,simStatus:'UNKNOWN',wechatStatus:'UNKNOWN',douyinStatus:'UNKNOWN',alipayStatus:'UNKNOWN',emulatorStatus:'UNKNOWN'});assert.equal(result.score,100);assert.equal(result.knownChecks,5);assert.equal(result.eligibleForDecision,false);});
test("相同坐标距离为零",()=>assert.equal(distanceInMeters({latitude:31.2304,longitude:121.4737},{latitude:31.2304,longitude:121.4737}),0));
