import test from "node:test";
import assert from "node:assert/strict";
import { calculateDeviceRiskScore, distanceInMeters } from "./safety.service.js";

const healthy = { deviceId:"device-test-001",simPresent:true,wechatInstalled:true,douyinInstalled:true,alipayInstalled:true,emulatorDetected:false,cloudDeviceDetected:false,scriptDetected:false,networkRiskDetected:false,ipRiskDetected:false,location:{latitude:31.2304,longitude:121.4737,referenceLatitude:31.2304,referenceLongitude:121.4737,maxDistanceMeters:50_000} };

test("十项健康检测得到 100 分",()=>assert.equal(calculateDeviceRiskScore(healthy).score,100));
test("五项通过得到 50 分并满足自动封号阈值",()=>{const result=calculateDeviceRiskScore({...healthy,simPresent:false,wechatInstalled:false,douyinInstalled:false,alipayInstalled:false,emulatorDetected:true});assert.equal(result.score,50);assert.equal(result.score<60,true);});
test("60 分边界不自动封号",()=>{const result=calculateDeviceRiskScore({...healthy,simPresent:false,wechatInstalled:false,douyinInstalled:false,alipayInstalled:false});assert.equal(result.score,60);assert.equal(result.score<60,false);});
test("相同坐标距离为零",()=>assert.equal(distanceInMeters({latitude:31.2304,longitude:121.4737},{latitude:31.2304,longitude:121.4737}),0));
