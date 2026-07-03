const bcrypt = require('bcryptjs');

async function generar() {
    const hash = await bcrypt.hash('', 10);
    console.log("PEGA ESTE HASH EN LA BD:", hash);
}
generar();