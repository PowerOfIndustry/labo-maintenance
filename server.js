const { OPCUAServer, Variant, DataType } = require("node-opcua");

(async () => {
  const server = new OPCUAServer({ port: 4840, resourcePath: "/UA/Machine", alternateHostname: ["host.docker.internal"] });
  await server.initialize();

  const addressSpace = server.engine.addressSpace;
  const ns = addressSpace.getOwnNamespace();
  const machine = ns.addObject({ organizedBy: addressSpace.rootFolder.objects, browseName: "Machine1" });
  const DERIVE = process.argv.includes("--derive");
  const TAUX = 0.02;      // +2 % par "heure simulée"
  const ACCEL = 60;       // 1 s réelle = 1 min simulée (à toi de régler)
  let temp = 60, vib = 2.0, courant = 12, pression = 5, heures = 0;
  let facteurVib = 1;
  setInterval(() => {
    if (DERIVE) facteurVib *= 1 + TAUX * ACCEL / 3600;
    temp     = 60 + Math.random() * 5;
    vib      = (2.0 + Math.random() * 0.5) * facteurVib;
    courant  = 12 + Math.random() * 3;
    pression = 5 + Math.random() * 1;
    heures  += ACCEL / 3600;   // le compteur suit la même accélération
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
  ajouter("Pression", () => pression);
  ajouter("Heures", () => heures);

  await server.start();
  console.log("Serveur OPC-UA prêt :", server.getEndpointUrl());
})();