migrate(
  (app) => {
    const cidCol = app.findCollectionByNameOrId('cid10_codes')
    const cidData = [
      { code: 'A09', description: 'Diarreia e gastroenterite de origem infecciosa presumível' },
      { code: 'B19', description: 'Hepite viral não especificada' },
      { code: 'C50', description: 'Neoplasia maligna da mama' },
      { code: 'C61', description: 'Neoplasia maligna da próstata' },
      { code: 'D50', description: 'Anemia por deficiência de ferro' },
      { code: 'E03', description: 'Hipotireoidismo' },
      { code: 'E66', description: 'Obesidade' },
      { code: 'E78', description: 'Distúrbios do metabolismo das lipoproteínas' },
      { code: 'F32', description: 'Episódio depressivo' },
      { code: 'F90', description: 'Transtorno de hiperatividade e déficit de atenção' },
      { code: 'G40', description: 'Epilepsia' },
      { code: 'H40', description: 'Glaucoma' },
      { code: 'I20', description: 'Angina pectoris' },
      { code: 'I25', description: 'Doença isquêmica crônica do coração' },
      { code: 'I50', description: 'Insuficiência cardíaca' },
      { code: 'I63', description: 'Infarto cerebral' },
      { code: 'I80', description: 'Flebite e tromboflebite' },
      { code: 'J03', description: 'Amigdalite aguda' },
      { code: 'J06', description: 'Infecção aguda das vias aéreas superiores' },
      { code: 'J20', description: 'Bronquite aguda' },
      { code: 'K29', description: 'Gastrite e duodenite' },
      { code: 'K59', description: 'Constipação' },
      { code: 'L20', description: 'Dermatite atópica' },
      { code: 'L70', description: 'Acne' },
      { code: 'M06', description: 'Artrite reumatoide' },
      { code: 'M15', description: 'Artrose' },
      { code: 'M79', description: 'Reumatismo não especificado' },
      { code: 'N18', description: 'Doença renal crônica' },
      { code: 'N20', description: 'Calculose do rim e do ureter' },
      { code: 'N40', description: 'Hiperplasia da próstata' },
      { code: 'O00', description: 'Gravidez ectópica' },
      { code: 'O80', description: 'Parto único espontâneo' },
      { code: 'R51', description: 'Cefaleia' },
      { code: 'R10', description: 'Dor abdominal' },
      { code: 'R42', description: 'Tontura e instabilidade' },
      { code: 'S82', description: 'Fratura do tornozelo' },
      { code: 'S06', description: 'Traumatismo intracraniano' },
      { code: 'T78', description: 'Reação adversa não especificada' },
      { code: 'Z00', description: 'Exame médico geral' },
      { code: 'Z76', description: 'Pessoa em busca de auxílio administrativo' },
    ]
    for (const c of cidData) {
      try {
        app.findFirstRecordByData('cid10_codes', 'code', c.code)
      } catch (_) {
        const rec = new Record(cidCol)
        rec.set('code', c.code)
        rec.set('description', c.description)
        try {
          app.save(rec)
        } catch (_) {}
      }
    }

    const medCol = app.findCollectionByNameOrId('medications')
    const medData = [
      {
        name: 'AAS 100mg',
        active_ingredient: 'Ácido Acetilsalicílico',
        laboratory: 'Bayer',
        presentation: 'Comprimidos',
        indications: 'Prevenção secundária de eventos cardiovasculares, antiagregante plaquetário.',
        contraindications:
          'Úlcera péptica ativa, hemofilia, asma induzida por AAS, terceiro trimestre de gravidez.',
        interactions: 'Aumenta risco de sangramento com anticoagulantes. Reduz eficácia de IECA.',
      },
      {
        name: 'Captopril 25mg',
        active_ingredient: 'Captopril',
        laboratory: 'Medley',
        presentation: 'Comprimidos',
        indications: 'Hipertensão arterial, insuficiência cardíaca, nefropatia diabética.',
        contraindications:
          'Gravidez, estenose bilateral de artéria renal, angioedema prévio por IECA.',
        interactions:
          'Hipercalemia com diuréticos poupadores de potássio. Potencializa efeito de anti-hipertensivos.',
      },
      {
        name: 'Varfarina 5mg',
        active_ingredient: 'Varfarina Sódica',
        laboratory: 'União Química',
        presentation: 'Comprimidos',
        indications: 'Trombose venosa profunda, embolia pulmonar, fibrilação atrial.',
        contraindications:
          'Gravidez, sangramento ativo, úlcera péptica, hipertensão grave não controlada.',
        interactions:
          'AINEs, AAS, amiodarona e ciprofloxacino aumentam risco de sangramento. Fenobarbital reduz efeito.',
      },
      {
        name: 'Sinvastastina 20mg',
        active_ingredient: 'Sinvastatina',
        laboratory: 'EMS',
        presentation: 'Comprimidos',
        indications: 'Hipercolesterolemia, prevenção cardiovascular.',
        contraindications: 'Doença hepática ativa, gravidez, lactação.',
        interactions: 'Risco de miopatia com macrolídeos, antifúngicos azólicos e ciclosporina.',
      },
      {
        name: 'Levotiroxina 50mcg',
        active_ingredient: 'Levotiroxina Sódica',
        laboratory: 'Pfizer',
        presentation: 'Comprimidos',
        indications: 'Hipotireoidismo, supressão de TSH.',
        contraindications: 'Tireotoxicose não tratada, infarto agudo do miocárdio recente.',
        interactions:
          'Reduce absorção com cálcio, ferro, sucralfato. Aumenta efeito de anticoagulantes.',
      },
      {
        name: 'Clonazepam 2mg',
        active_ingredient: 'Clonazepam',
        laboratory: 'EMS',
        presentation: 'Comprimidos',
        indications: 'Ansiedade, crises de pânico, epilepsia, distúrbios do sono.',
        contraindications:
          'Miastenia gravis, glaucoma de ângulo fechado, insuficiência respiratória grave.',
        interactions: 'Potencializa depressão do SNC com álcool, opioides e outros sedativos.',
      },
      {
        name: 'Escitalopram 10mg',
        active_ingredient: 'Escitalopram',
        laboratory: 'Eurofarma',
        presentation: 'Comprimidos',
        indications: 'Depressão, transtorno de ansiedade generalizada, TAG, pânico.',
        contraindications: 'Uso concomitante com IMAO, síndrome do QT longo.',
        interactions:
          'Síndrome serotoninérgica com tramadol, triptanos e IMAO. Aumenta risco de sangramento com AAS.',
      },
      {
        name: 'Pantoprazol 40mg',
        active_ingredient: 'Pantoprazol Sódico',
        laboratory: 'Eurofarma',
        presentation: 'Comprimidos',
        indications: 'Refluxo gastroesofágico, úlcera gástrica, erradicação de H. pylori.',
        contraindications: 'Hipersensibilidade a derivados benzimidazólicos.',
        interactions:
          'Reduz absorção de cetoconazol e clopidogrel. Pode prolongar eliminação de diazepam.',
      },
      {
        name: 'Hidroclorotiazida 25mg',
        active_ingredient: 'Hidroclorotiazida',
        laboratory: 'EMS',
        presentation: 'Comprimidos',
        indications: 'Hipertensão arterial, edema, insuficiência cardíaca leve.',
        contraindications: 'Anúria, hipersensibilidade a sulfonamidas, gravidez.',
        interactions: 'Hipocalemia com corticoides e anfotericina B. Aumenta toxicidade de lítio.',
      },
      {
        name: 'Glibenclamida 5mg',
        active_ingredient: 'Glibenclamida',
        laboratory: 'EMS',
        presentation: 'Comprimidos',
        indications: 'Diabetes mellitus tipo 2.',
        contraindications: 'Diabetes tipo 1, cetoacidose, insuficiência renal ou hepática grave.',
        interactions:
          'Hipoglicemia com AAS, AINEs e fluconazol. Reduz efeito com rifampicina e fenitoína.',
      },
      {
        name: 'Prednisolona 20mg',
        active_ingredient: 'Prednisolona',
        laboratory: 'Aché',
        presentation: 'Comprimidos',
        indications: 'Doenças inflamatórias e autoimunes, asma, alergias graves.',
        contraindications: 'Infecções sistêmicas não tratadas, tuberculose ativa.',
        interactions:
          'Reduz efeito de diuréticos e anticoagulantes. AINEs aumentam risco de úlcera.',
      },
      {
        name: 'Amlodipina 5mg',
        active_ingredient: 'Besilato de Amlodipina',
        laboratory: 'EMS',
        presentation: 'Comprimidos',
        indications: 'Hipertensão arterial, angina estável.',
        contraindications: 'Choque cardiogênico, estenose aórtica grave, hipersensibilidade.',
        interactions:
          'Potencializa efeito de outros anti-hipertensivos. Cetoconazol aumenta nível plasmático.',
      },
      {
        name: 'Azitromicina 500mg',
        active_ingredient: 'Azitromicina',
        laboratory: 'Eurofarma',
        presentation: 'Comprimidos',
        indications: 'Infecções respiratórias, otite, sinusite, faringite, infecções genitais.',
        contraindications: 'Hipersensibilidade a macrolídeos, prolongamento do QT.',
        interactions:
          'Aumenta nível de varfarina e digoxina. Não usar com antiarrítmicos classe IA e III.',
      },
      {
        name: 'Sertralina 50mg',
        active_ingredient: 'Cloridrato de Sertralina',
        laboratory: 'EMS',
        presentation: 'Comprimidos',
        indications: 'Depressão, TOC, pânico, TEPT, ansiedade social.',
        contraindications: 'Uso concomitante com IMAO, pimozida.',
        interactions:
          'Síndrome serotoninérgica com tramadol e triptanos. Aumenta risco de sangramento com AAS.',
      },
      {
        name: 'Dexametasona 4mg',
        active_ingredient: 'Fosfato de Dexametasona',
        laboratory: 'Aché',
        presentation: 'Comprimidos',
        indications: 'Doenças inflamatórias, edema cerebral, reações alérgicas graves.',
        contraindications:
          'Infecções sistêmicas não tratadas, imunização com vacinas de vírus vivo.',
        interactions:
          'Reduz efeito de anticoagulantes e hipoglicemiantes. AINEs aumentam risco de úlcera.',
      },
    ]
    for (const m of medData) {
      try {
        app.findFirstRecordByData('medications', 'name', m.name)
      } catch (_) {
        const rec = new Record(medCol)
        rec.set('name', m.name)
        rec.set('active_ingredient', m.active_ingredient)
        rec.set('laboratory', m.laboratory)
        rec.set('presentation', m.presentation)
        rec.set('indications', m.indications)
        rec.set('contraindications', m.contraindications)
        rec.set('interactions', m.interactions)
        try {
          app.save(rec)
        } catch (_) {}
      }
    }
  },
  (app) => {},
)
