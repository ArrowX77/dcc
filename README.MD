# node-red-contrib-daikin-cloud

[![NPM version](http://img.shields.io/npm/v/node-red-contrib-daikin-cloud.svg)](https://www.npmjs.com/package/node-red-contrib-daikin-cloud)
[![Downloads](https://img.shields.io/npm/dm/node-red-contrib-daikin-cloud.svg)](https://www.npmjs.com/package/node-red-contrib-daikin-cloud)
![Test and Release](https://github.com/DrHauss/node-red-contrib_BRP069C4/workflows/Test%20and%20Release/badge.svg)

This version is based on node-red-contrib_BRP069C4 from bartjanisse and DrHauss.

Node-Red Node for accessing Daikin Cloud to control AC devices and get their status. 

## Important Information

When you integrate this Node please make sure you do not refresh data out of the cloud too fast. Please still think about the needed resources and costs on Daikin side to operate the cloud services and only allow meaningful poll intervals!

This Node **doesn't** use a public and documented API for controlling the AC devices. You are using this on your own risk.

## Dependencies
**Requires a valid Daikin Cloud Account which is authenticated via e-mail and password (no direct social login is possible!) or a valid tokenset.json which could be generated via daikin-controller-cloud module ([Details here](https://github.com/Apollon77/daikin-controller-cloud/))**

## How to use
 * Define a Node and configure username and password if you want to use the authentication via user/pass. If you configured your account with social media login (Apple, Facebook...) then you need to have a valid tokenset.json
 * Set msg.topic to "get" if you want to receive the actual status of your device(s)
 * Set msg.topic to "set" if you want to set the status of your device. This requires the following additional information:
    * msg.payload.ssid = Device SSID (original one starting with DaikinAP... Is available in the device object)
    * msg.payload.managementPoint e.a. "climateControl"
    * msg.payload.dataPoint e.a. "temperatureControl"
    * msg.payload.dataPointPath = Only needed in some cases
    * msg.payload.value = target value

