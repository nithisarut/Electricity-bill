"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require('express');
var app = express();
var fs_1 = require("fs");
var getdataDayWeekMonth = require('./dataMeter').getdataDayWeekMonth;
(0, fs_1.readFile)('../../assets/data_power_meter.json', 'utf8', function (err, datajson) {
    if (err) {
        console.error('เกิดข้อผิดพลาดในการอ่านไฟล์', err);
        return;
    }
    var jsonData = JSON.parse(datajson);
    var data = jsonData;
    //   app.get('/getCurrentCost', (req: any, res: any) => {
    //     const sd = new Date(req.query.sd);
    //     const ed = new Date(req.query.ed);
    //     const metertype = req.query.metertype;
    //     const result = getCurrentCost(data, sd, ed, metertype);
    //     res.json(result);
    //   });
    app.get('/getdataDayWeekMonth', function (req, res) {
        var sd = new Date(req.query.sd);
        var ed = new Date(req.query.ed);
        var metertype = req.query.metertype;
        var result = getdataDayWeekMonth(data, sd, ed, metertype);
        if (!sd || !ed || !metertype) {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }
        res.json(result);
    });
    var PORT = process.env['PORT'] || 3001;
    app.listen(PORT, function () {
        console.log('Server is running on port ${PORT}');
    });
});
