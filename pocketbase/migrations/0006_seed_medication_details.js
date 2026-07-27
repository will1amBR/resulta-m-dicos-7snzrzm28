migrate(
  (app) => {
    const medData = [
      {
        name: 'Dipirona Monoidratada 500mg',
        indications: 'Alivio de dor leve a moderada, febre, colicas.',
        contraindications:
          'Gravidez terceiro trimestre, historico de agranulocitose, insuficiencia hepatica grave, asma analgesica.',
        interactions:
          'Pode potencializar efeito de anticoagulantes. Evitar concomitancia com alcool.',
      },
      {
        name: 'Paracetamol 750mg',
        indications: 'Alivio de dor e febre. Seguro na gravidez e lactacao.',
        contraindications:
          'Insuficiencia hepatica, hepatite viral, alcoolismo cronico, doenca hepatica ativa.',
        interactions:
          'Risco de hepatotoxicidade com alcool, anticonvulsivantes (fenitoina, fenobarbital) e isoniazida.',
      },
      {
        name: 'Amoxicilina 500mg',
        indications:
          'Infeccoes respiratorias, otite media, sinusite, faringite, infeccoes urinarias.',
        contraindications: 'Alergia a penicilinas, mononucleose infecciosa.',
        interactions:
          'Reduz eficacia de anticoncepcionais orais. Aumenta efeito de varfarina com uso prolongado.',
      },
      {
        name: 'Losartana Potassica 50mg',
        indications: 'Hipertensao arterial, insuficiencia cardiaca, nefropatia diabetica.',
        contraindications:
          'Gravidez, estenose bilateral de arteria renal, hipersensibilidade aos componentes.',
        interactions:
          'Aumenta risco de hipercalemia com diureticos poupadores de potassio e AINEs. Potencializa efeito de outros anti-hipertensivos.',
      },
      {
        name: 'Omeprazol 20mg',
        indications: 'Refluxo gastroesofagico, ulcera gastrica, erradicacao de H. pylori.',
        contraindications: 'Hipersensibilidade a derivados benzimidazolicos.',
        interactions:
          'Reduz absorcao de cetoconazol, irinotecano e clopidogrel. Pode prolongar eliminacao de diazepam e fenitoina.',
      },
      {
        name: 'Metformina 850mg',
        indications: 'Diabetes mellitus tipo 2, especialmente em pacientes com sobrepeso.',
        contraindications:
          'Insuficiencia renal (TFG < 30), cetoacidose diabetica, insuficiencia hepatica grave, alcoolismo.',
        interactions:
          'Aumenta risco de acidose lactica com contraste iodado e AINEs. Pode reduzir absorcao de B12 com uso prolongado.',
      },
      {
        name: 'Ibuprofeno 600mg',
        indications: 'Dor moderada a intensa, inflamacao, febre, artrites.',
        contraindications:
          'Ulcera peptica ativa, insuficiencia renal grave, terceiro trimestre de gravidez, sangramento ativo.',
        interactions:
          'Aumenta risco de sangramento com anticoagulantes e AAS. Reduz eficacia de anti-hipertensivos e diureticos.',
      },
    ]

    for (const m of medData) {
      try {
        const rec = app.findFirstRecordByData('medications', 'name', m.name)
        rec.set('indications', m.indications)
        rec.set('contraindications', m.contraindications)
        rec.set('interactions', m.interactions)
        app.save(rec)
      } catch (_) {}
    }
  },
  (app) => {},
)
