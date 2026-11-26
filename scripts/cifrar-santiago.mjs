// Cifra la lista de clientes de Santiago para que el sitio (público) solo la muestre con contraseña.
// Uso: node scripts/cifrar-santiago.mjs <ventas.txt> <contraseña>
// ventas.txt: secciones "## NOMBRE DE PESTAÑA" y renglones separados por "|".
import { webcrypto as crypto } from "node:crypto";
import fs from "node:fs";

const [archivo, clave] = process.argv.slice(2);
if (!archivo || !clave) throw new Error("Uso: node scripts/cifrar-santiago.mjs <ventas.txt> <contraseña>");

const hojas = {};
let actual = null;
for (const linea of fs.readFileSync(archivo, "utf8").split(/\r?\n/)) {
  if (linea.startsWith("## ")) { actual = linea.slice(3).trim(); hojas[actual] = []; continue; }
  if (actual && linea.trim()) hojas[actual].push(linea.split("|").map((c) => c.trim()));
}
const texto = JSON.stringify({ hojas, cargado: new Date().toISOString() });

const ITER = 600000;
const sal = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveKey"]);
const llave = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: sal, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, llave, new TextEncoder().encode(texto)));
const b64 = (u) => Buffer.from(u).toString("base64");
fs.writeFileSync("src/data/santiago.cifrado.json", JSON.stringify({ v: 1, iter: ITER, sal: b64(sal), iv: b64(iv), datos: b64(cifrado) }) + "\n");
console.log("Listo:", Object.entries(hojas).map(([k, v]) => `${k}: ${v.length} renglones`).join(", "));
