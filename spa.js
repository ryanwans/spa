'use strict';

const axios = require('axios'), sched = require('node-schedule');

function grabProcess() {
    var PROCESS = {
        start: {
            usage: process.cpuUsage(),
            time: Date.now()
        },
        end: {},
        pid: process.pid,
        fours: {},
        mem: {},
        user: process.env.USER
    }

    function spinTime(obj) {
        var i, v = Date.now();
        while (Date.now() - v < 1000);
        i = Date.now()
        var endCPU = process.cpuUsage(obj.start.usage)
        obj.end = {
            usageRaw: endCPU,
            usage: 100 * (endCPU.user + endCPU.system) / ((Date.now() - obj.start.time) * 1000),
            time: i
        }
        PROCESS.start.realTime = v;
        PROCESS.end = obj.end;
    }
    function foursTest(obj) {
        var ends = {est: [], cpu: []}, count = 0;
        while (count < 4) {
            var tempStart = Date.now(), tCPU = process.cpuUsage();
            while (Date.now() - tempStart < 1000);
            var tempEnd = Date.now(), tCPUEnd = process.cpuUsage();
            var Estimated = tempEnd-tempStart;
            var CPUAct = ((tCPUEnd.user + tCPUEnd.system)/1000) - ((tCPU.user + tCPU.system)/1000)
            ends.est.push(Estimated), ends.cpu.push(CPUAct);
            count++;
        }
        var f1=0,f2=0;
        for(let i=0; i<ends.est.length; i++) {f1 = f1 + ends.est[i]}
        for(let i=0; i<ends.cpu.length; i++) {f2 = f2 + ends.cpu[i]}
        f1 = f1/4, f2 = f2/4;
        PROCESS.fours.estAvg = 1000-f1, PROCESS.fours.cpuAvg = 1000-f2;
    }
    function memGrab(obj) {
        var used = process.memoryUsage().heapUsed / (1024 * 1024);
        var total = process.memoryUsage().heapTotal / (1024 * 1024);
        var rss = process.memoryUsage().rss / (1024 * 1024);
        obj.mem = {used: used, total: total, rss: rss}
    }
    function finals(obj) {
        PROCESS.events = process._eventsCount;
        PROCESS.uptime = process.uptime();
    }
    PROCESS.publishDate = Date.now()
    spinTime(PROCESS);
    foursTest(PROCESS);
    memGrab(PROCESS);
    finals(PROCESS);
    return PROCESS;
}

function fire(parmProcess, parmKey, parmDate, a,b,c,d, parmCode) {
    var fURL = "https://ryanwans.com/spa-analytics/openEnd/fireRequest?urlAuthentication="+a+b+c+d+"-authSpaNODE&dateCode="+parmDate;
    var fPOST = {
        data: parmProcess,
        auth: parmKey,
        secret: parmCode,
        manager: "ryanwans-api-spalytics-live/endpoint"
    };
    var tempReturn;
    axios.post(fURL, fPOST)
    .then((res) => {
        tempReturn = {code: res.statusCode, public: '28dn39dm39s2i'}
    })
    .catch((error) => {
        tempReturn = {code: 400, err: error}
    })
    return tempReturn || "no return";
}

module.exports = {
    grab: (apiKey, cronCode, postCallback) => {
        var proc = grabProcess();
        if(typeof cronCode === "undefined") {
            var fireEvent = fire(proc, apiKey, Date.now(), 0, 1, 1, 0, "837hys92874");
            if(postCallback){postCallback(fireEvent);}
            if(fireEvent.code === 400) {throw new Error(fireEvent.err)}
            else if(fireEvent === "no return") {return null;}
            else {return fireEvent}
        } else if (cronCode === "" || cronCode === null) {
            throw new Error("Invalid CRON Code (Custom Error)");
        } else {
            var __CRON_SCHED__ = sched.scheduleJob(cronCode, function(fireDate) {
                var fireEvent = fire(proc, apiKey, Date.now(), 0, 1, 1, 0, "837hys92874");
                if(postCallback){postCallback(fireEvent);}
                if(fireEvent.code === 400) {throw new Error(fireEvent.err)}
                else if(fireEvent === "no return") {return null;}
                else {return fireEvent}
            });
        }
    }
}