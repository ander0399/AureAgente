require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, Product } = require('../models');

const products = [
  { name: 'Cadena Figaro 50cm', category: 'cadena', price: 85000, stock: 15, description: 'Cadena de oro laminado 18K estilo Figaro, acabado espejo. Grosor 4mm.' },
  { name: 'Cadena Eslabón Cubano 55cm', category: 'cadena', price: 110000, stock: 10, description: 'Cadena cubana de oro laminado 18K, grosor 6mm. Brillo intenso y gran durabilidad.' },
  { name: 'Pulsera Eslabón Grueso', category: 'pulsera', price: 72000, stock: 12, description: 'Pulsera de eslabón grueso bañada en oro 18K. Talla ajustable 18-21cm.' },
  { name: 'Pulsera Rígida Lisa', category: 'pulsera', price: 58000, stock: 20, description: 'Pulsera rígida lisa en oro laminado 18K. Elegante y minimalista.' },
  { name: 'Dije Cruz de Malta', category: 'dije', price: 45000, stock: 25, description: 'Dije Cruz de Malta en oro laminado 18K. Incluye cadena porta-dije.' },
  { name: 'Dije Corazón Zirconia', category: 'dije', price: 52000, stock: 18, description: 'Dije corazón con zirconia central en oro laminado 18K.' },
  { name: 'Combo Gucci (Cadena + Pulsera)', category: 'combo', price: 145000, stock: 8, description: 'Combo exclusivo: cadena Figaro 50cm + pulsera eslabón grueso. Ahorra $12.000 vs separado.' },
  { name: 'Combo Lujo (Cadena + Pulsera + Dije)', category: 'combo', price: 185000, stock: 5, description: 'Set completo de oro laminado 18K: cadena, pulsera y dije a elección. El regalo perfecto.' },
];

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const p of products) {
    await Product.findOrCreate({ where: { name: p.name }, defaults: p });
  }

  console.log(`[Seeder] ${products.length} productos insertados/verificados.`);
  await sequelize.close();
}

seed().catch((err) => {
  console.error('[Seeder] Error:', err.message);
  process.exit(1);
});
