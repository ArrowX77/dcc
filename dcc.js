const DaikinCloud = require("daikin-controller-cloud");

const options = {
  logger: console.log, // optional, logger function used to log details depending on loglevel
  logLevel: "debug", // info, debug optional, Loglevel of Library, default 'warn' (logs nothing by default)
  communicationTimeout: 10000, // Amount of ms to wait for request and responses before timeout
  communicationRetries: 3, // Amount of retries when connection times out
};
let lastUpdated = 0;
let devices;
let tokenSet;

module.exports = function (RED) {
  function daikin_brp069c4Node(config) {
    const cacheTime = +config.cachetime || 60;
    RED.nodes.createNode(this, config);
    let node = this;
    let daikinCloud;

    options.logLevel = config.logLevel;

    node.init = async function () {
      try {
        setNodeStatus({ fill: "gray", shape: "dot", text: "Connecting..." });

        if (config.timeout) {
          options.communicationTimeout = +config.timeout;
        }
        if (config.retry) {
          options.communicationRetries = +config.retry;
        }

        if (tokenSet) {
          daikinCloud = new DaikinCloud(tokenSet, options);
          node.debug("tokenSet found and used");
        } else {
          const credentials = this.credentials;
          if (
            credentials &&
            credentials.username != null &&
            credentials.password != null
          ) {
            daikinCloud = new DaikinCloud(null, options);
            tokenSet = await daikinCloud.login(
              credentials.username,
              credentials.password
            );
            daikinCloud = new DaikinCloud(tokenSet, options);
          } else {
            node.error("No credentials provided!");
            setNodeStatus({
              fill: "red",
              shape: "dot",
              text: "No credentials provided!",
            });
          }
        }
        updateDevices();
        setNodeStatus({ fill: "blue", shape: "dot", text: "Waiting..." });
      } catch (error) {
        setNodeStatus({ fill: "red", shape: "dot", text: error });
        node.error(error);
      }
    };

    node.on("input", function (msg, send, done) {
      send =
        send ||
        function () {
          node.send.apply(node, arguments);
        };

      const payload = msg.payload;
      const topic = msg.topic;

      switch (topic) {
        case "get":
          updateDevices();
          if (devices) {
            msg.payload = devices;
            msg.lastUpdated = lastUpdated;
            node.send(msg);
          } else {
            node.send(null);
            setNodeStatus({
              fill: "gray",
              shape: "dot",
              text: "failed to get devices",
            });
          }
          break;
        case "set":
          const device = getDeviceBySsid(payload.ssid);
          setDeviceData(
            device,
            payload.managementPoint,
            payload.dataPoint,
            payload.dataPointPath,
            payload.value
          );
          break;
        case "reset":
          break;
        default:
          send(null);
      }

      if (done) {
        done();
      }
    });

    function getDeviceBySsid(ssid) {
      const result = devices.find((device) => {
        return device.getData("gateway", "ssid").value === ssid;
      });

      return result ? result : null; // or undefined
    }

    async function setDeviceData(
      device,
      managementPoint,
      dataPoint,
      dataPointPath,
      value
    ) {
      try {
        await device.setData(managementPoint, dataPoint, dataPointPath, value);
        await device.updateData();
        setNodeStatus({
          fill: "green",
          shape: "dot",
          text: "Set data succesfully to " + value,
        });
      } catch (error) {
        setNodeStatus({ fill: "red", shape: "dot", text: error });
        node.error(error);
      }
    }

    async function updateDevices() {
      try {
        let timeDiff = (new Date().getTime() - lastUpdated) / 1000;
        if (timeDiff >= cacheTime) {
          devices = await daikinCloud.getCloudDevices();
          lastUpdated = new Date().getTime();
          setNodeStatus({
            fill: "green",
            shape: "dot",
            text: "updated devices",
          });
        } else {
          setNodeStatus({
            fill: "green",
            shape: "dot",
            text: "using cached devices",
          });
        }
      } catch (error) {
        setNodeStatus({ fill: "red", shape: "dot", text: error });
        node.error(error);
      }
    }

    function setNodeStatus({ fill, shape, text }) {
      var dDate = new Date();
      node.status({
        fill: fill,
        shape: shape,
        text: text + " (" + dDate.toLocaleTimeString() + ")",
      });
    }

    node.init();
  }

  RED.nodes.registerType("Daikin-Cloud-Controller", daikin_brp069c4Node, {
    credentials: {
      username: { type: "text" },
      password: { type: "password" },
    },
  });
};
