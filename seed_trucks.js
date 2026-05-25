import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase config (replace with your environment variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Iniciando seeder de camiones...");

  const imagePath = "/home/student2/.gemini/antigravity-ide/brain/c202da08-96cd-4818-acb5-c394ed4a1bb3/cat_797f_norte_1779582140070.png";
  let imageUrl = null;

  try {
    const fileBuffer = fs.readFileSync(imagePath);
    const fileName = `seed_truck_${Date.now()}.png`;

    console.log("Subiendo imagen de prueba a Supabase Storage...");
    const { data, error } = await supabase.storage
      .from('truck_images')
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error("Error subiendo imagen:", error.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('truck_images')
      .getPublicUrl(fileName);
    
    imageUrl = publicUrlData.publicUrl;
    console.log("Imagen subida con éxito:", imageUrl);

  } catch (err) {
    console.error("Error leyendo o subiendo la imagen local:", err);
    return;
  }

  // Generar 10 camiones (5 Tajo Norte, 5 Tajo Sur)
  const trucks = [];
  
  // Tajo Norte
  for (let i = 1; i <= 5; i++) {
    trucks.push({
      id_camion: `CAT-N00${i}`,
      modelo: "CAT 797F",
      capacidad_ton: 400,
      carga_operativa_ton: 320 + Math.floor(Math.random() * 20),
      cantidad_neumaticos: 6,
      tamano_neumatico: "59/80R63",
      tajo_asignado: "Tajo Norte",
      estado: "OPERATIVO",
      disponibilidad_pct: 85 + Math.floor(Math.random() * 10),
      horas_efectivas_dia: 21.83,
      dias_operacion_mes: 28,
      precio_neumatico_usd: 52000,
      vida_util_proyectada_h: 6201,
      periodo_analisis_meses: 6,
      dureza_roca_mpa: 70,
      pendiente_pct: 10,
      distancia_chancadora_km: 4.5,
      notas: "Camión asignado al tajo norte. Equipo en operación normal.",
      image_url: imageUrl,
    });
  }

  // Tajo Sur
  for (let i = 1; i <= 5; i++) {
    trucks.push({
      id_camion: `CAT-S00${i}`,
      modelo: "CAT 797F",
      capacidad_ton: 400,
      carga_operativa_ton: 320 + Math.floor(Math.random() * 20),
      cantidad_neumaticos: 6,
      tamano_neumatico: "59/80R63",
      tajo_asignado: "Tajo Sur",
      estado: "OPERATIVO",
      disponibilidad_pct: 80 + Math.floor(Math.random() * 10),
      horas_efectivas_dia: 21.83,
      dias_operacion_mes: 28,
      precio_neumatico_usd: 52000,
      vida_util_proyectada_h: 4801,
      periodo_analisis_meses: 6,
      dureza_roca_mpa: 110,
      pendiente_pct: -10,
      distancia_chancadora_km: 3.8,
      notas: "Camión asignado al tajo sur con roca dura. Operación continua.",
      image_url: imageUrl,
    });
  }

  console.log("Insertando camiones en la base de datos...");
  const { error: insertError } = await supabase.from('camiones').insert(trucks);

  if (insertError) {
    console.error("Error insertando camiones:", insertError.message);
  } else {
    console.log("¡10 camiones insertados con éxito!");
  }
}

seed();
