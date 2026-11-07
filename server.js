const { OPCUAServer, Variant, DataType } = require("node-opcua");

(async () => {
  const server = new OPCUAServer({ port: 4840, resourcePath: "/UA/Machine", alternateHostname: ["host.docker.internal"] });
  await server.initialize();

  const addressSpace = server.engine.addressSpace;
  const ns = addressSpace.getOwnNamespace();
  const machine = ns.addObject({ organizedBy: addressSpace.rootFolder.objects, browseName: "Machine1" });
  const DERIVE = process.argv.includes("--derive");
  
  let derive = 0;
  let temp = 60, vib = 2.0, courant = 12, heures = 0;
  setInterval(() => {
    if (DERIVE) derive += 0.1;
    temp = 60 + Math.random() * 5 + derive;
    vib = 2.0 + Math.random() * 0.5;
    courant = 12 + Math.random();
    heures += 1 / 3600;
  }, 1000);

  const ajouter = (nom, lire) => ns.addVariable({
    componentOf: machine,
    browseName: nom,
    nodeId: `s=${nom}`,
    dataType: "Double",
    minimumSamplingInterval: 1000,
    value: { get: () => new Variant({ dataType: DataType.Double, value: lire() }) }
  });

  ajouter("Temperature", () => temp);
  ajouter("Vibration", () => vib);
  ajouter("Courant", () => courant);
  ajouter("Heures", () => heures);

  await server.start();
  console.log("Serveur OPC-UA prêt :", server.getEndpointUrl());
})();