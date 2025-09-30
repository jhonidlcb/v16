
export function verifyEnvironmentConfiguration() {
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_PASS: process.env.GMAIL_PASS
  };

  const expectedValues = {
    DATABASE_URL: 'postgresql://neondb_owner:npg_f1jQRacpFG3V@ep-red-shape-ac6qnrhr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    GMAIL_USER: 'jhonidelacruz89@gmail.com',
    GMAIL_PASS: 'htzmerglesqpdoht'
  };

  console.log('🔍 Verificando configuración de variables de entorno...');
  
  let allCorrect = true;
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.error(`❌ Variable ${key} no está configurada`);
      allCorrect = false;
    } else if (value !== expectedValues[key as keyof typeof expectedValues]) {
      console.warn(`⚠️  Variable ${key} no coincide con el valor esperado`);
      console.warn(`   Actual: ${value.substring(0, 50)}...`);
      console.warn(`   Esperado: ${expectedValues[key as keyof typeof expectedValues].substring(0, 50)}...`);
      allCorrect = false;
    } else {
      console.log(`✅ Variable ${key} configurada correctamente`);
    }
  }

  return allCorrect;
}
