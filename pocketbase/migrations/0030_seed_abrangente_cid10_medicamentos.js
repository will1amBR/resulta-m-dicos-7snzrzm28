migrate(
  (app) => {
    const cidCol = app.findCollectionByNameOrId('cid10_codes')
    const medCol = app.findCollectionByNameOrId('medications')

    // 1. Catálogo abrangente e realista de códigos CID-10 de múltiplos capítulos da OMS / SUS
    const cidList = [
      // Capítulo I: Algumas doenças infecciosas e parasitárias (A00-B99)
      { code: 'A00', description: 'Cólera' },
      { code: 'A01', description: 'Febres tifóide e paratifóide' },
      { code: 'A02', description: 'Outras infecções por Salmonella' },
      { code: 'A04', description: 'Outras infecções bacterianas intestinais' },
      { code: 'A06', description: 'Amebíase' },
      { code: 'A08', description: 'Infecções intestinais virais' },
      {
        code: 'A09.0',
        description: 'Gastroenterite e colite de origem infecciosa não especificada',
      },
      {
        code: 'A15',
        description: 'Tuberculose respiratória com confirmação bacteriológica e histológica',
      },
      { code: 'A16', description: 'Tuberculose das vias respiratórias sem confirmação' },
      { code: 'A39', description: 'Infecção meningocócica' },
      { code: 'A41.9', description: 'Sepse não especificada' },
      { code: 'A46', description: 'Erisipela' },
      { code: 'A49', description: 'Infecção bacteriana de localização não especificada' },
      { code: 'A50', description: 'Sífilis congênita' },
      { code: 'A51', description: 'Sífilis precoce primária e secundária' },
      { code: 'A52', description: 'Sífilis tardia' },
      { code: 'A53', description: 'Outras formas e as não especificadas da sífilis' },
      { code: 'A54', description: 'Infecção gonocócica' },
      {
        code: 'A56',
        description: 'Outras infecções causadas por clamídias transmitidas por via sexual',
      },
      { code: 'A60', description: 'Infecções anogenitais por vírus do herpes (herpes simples)' },
      { code: 'A90', description: 'Dengue clássico' },
      { code: 'A91', description: 'Febre hemorrágica devida ao vírus do dengue' },
      { code: 'A92.0', description: 'Febre de Chikungunya' },
      { code: 'A92.8', description: 'Infecção por vírus Zika' },
      { code: 'A95', description: 'Febre amarela' },
      { code: 'B00', description: 'Infecções pelo vírus do herpes (herpes simples)' },
      { code: 'B01', description: 'Varicela (catapora)' },
      { code: 'B02', description: 'Herpes zoster (zona)' },
      { code: 'B05', description: 'Sarampo' },
      { code: 'B06', description: 'Rubéola' },
      { code: 'B15', description: 'Hepatite aguda A' },
      { code: 'B16', description: 'Hepatite aguda B' },
      { code: 'B17', description: 'Outras hepatites virais agudas' },
      { code: 'B18.1', description: 'Hepatite viral crônica B sem agente Delta' },
      { code: 'B18.2', description: 'Hepatite viral crônica C' },
      { code: 'B20', description: 'Doença pelo vírus da imunodeficiência humana (HIV)' },
      {
        code: 'B24',
        description: 'Doença pelo vírus da imunodeficiência humana (HIV) não especificada',
      },
      { code: 'B26', description: 'Caxumba (parotidite epidêmica)' },
      { code: 'B27', description: 'Mononucleose infecciosa' },
      {
        code: 'B34.2',
        description: 'Infecção por coronavírus de localização não especificada / COVID-19',
      },
      { code: 'B35', description: 'Dermatofitose (tinea)' },
      { code: 'B37.0', description: 'Estomatite por Candida (sapinho)' },
      { code: 'B37.3', description: 'Candidíase da vulva e da vagina' },
      { code: 'B86', description: 'Escabiose (sarna)' },

      // Capítulo II: Neoplasias [tumores] (C00-D48)
      { code: 'C15', description: 'Neoplasia maligna do esôfago' },
      { code: 'C16', description: 'Neoplasia maligna do estômago' },
      { code: 'C18', description: 'Neoplasia maligna do cólon' },
      { code: 'C20', description: 'Neoplasia maligna do reto' },
      {
        code: 'C22',
        description: 'Neoplasia maligna do fígado e das vias biliares intra-hepáticas',
      },
      { code: 'C25', description: 'Neoplasia maligna do pâncreas' },
      { code: 'C34', description: 'Neoplasia maligna dos brônquios e dos pulmões' },
      { code: 'C43', description: 'Melanoma maligno da pele' },
      { code: 'C44', description: 'Outras neoplasias malignas da pele' },
      { code: 'C50.9', description: 'Neoplasia maligna da mama não especificada' },
      { code: 'C53', description: 'Neoplasia maligna do colo do útero' },
      { code: 'C54', description: 'Neoplasia maligna do corpo do útero' },
      { code: 'C56', description: 'Neoplasia maligna do ovário' },
      { code: 'C61.0', description: 'Neoplasia maligna da próstata' },
      { code: 'C64', description: 'Neoplasia maligna do rim, exceto pelve renal' },
      { code: 'C67', description: 'Neoplasia maligna da bexiga' },
      { code: 'C73', description: 'Neoplasia maligna da glândula tireóide' },
      { code: 'C81', description: 'Doença de Hodgkin' },
      {
        code: 'C85',
        description: 'Linfoma não-Hodgkin de outros tipos e de tipo não especificado',
      },
      { code: 'C90', description: 'Mieloma múltiplo e neoplasias malignas de plasmócitos' },
      { code: 'C91', description: 'Leucemia linfóide' },
      { code: 'C92', description: 'Leucemia mielóide' },
      { code: 'D12', description: 'Neoplasia benigna do cólon, reto, canal anal e ânus' },
      { code: 'D25', description: 'Leiomioma do útero (mioma)' },
      { code: 'D50.9', description: 'Anemia por deficiência de ferro não especificada' },
      { code: 'D51', description: 'Anemia por deficiência de vitamina B12' },
      { code: 'D53', description: 'Outras anemias nutricionais' },
      { code: 'D64.9', description: 'Anemia não especificada' },
      { code: 'D69.6', description: 'Trombocitopenia não especificada' },

      // Capítulo IV: Doenças endócrinas, nutricionais e metabólicas (E00-E90)
      { code: 'E03.9', description: 'Hipotireoidismo não especificado' },
      { code: 'E04', description: 'Outros bócios não-tóxicos' },
      { code: 'E05', description: 'Tireotoxicose (hipertireoidismo)' },
      { code: 'E06', description: 'Tireoidite de Hashimoto' },
      { code: 'E10', description: 'Diabetes mellitus insulino-dependente (Tipo 1)' },
      { code: 'E10.9', description: 'Diabetes mellitus tipo 1 sem complicações' },
      { code: 'E11.0', description: 'Diabetes mellitus não-insulino-dependente com coma' },
      { code: 'E11.2', description: 'Diabetes mellitus tipo 2 com complicações renais' },
      { code: 'E11.4', description: 'Diabetes mellitus tipo 2 com complicações neurológicas' },
      {
        code: 'E11.5',
        description: 'Diabetes mellitus tipo 2 com complicações circulatórias periféricas',
      },
      { code: 'E11.9', description: 'Diabetes mellitus tipo 2 sem complicações' },
      { code: 'E14', description: 'Diabetes mellitus não especificado' },
      { code: 'E27.1', description: 'Insuficiência adrenocortical primária (Doença de Addison)' },
      { code: 'E28.2', description: 'Síndrome dos ovários policísticos (SOP)' },
      { code: 'E55', description: 'Deficiência de vitamina D' },
      { code: 'E66.0', description: 'Obesidade devida a excesso de calorias' },
      { code: 'E66.9', description: 'Obesidade não especificada' },
      { code: 'E78.0', description: 'Hipercolesterolemia pura' },
      { code: 'E78.1', description: 'Hipergliceridemia pura' },
      { code: 'E78.2', description: 'Hiperlipidemia mista' },
      { code: 'E79.0', description: 'Hiperuricemia sem sinais de artrite inflamatória' },
      { code: 'E87.6', description: 'Hipopotassemia (hipocalemia)' },

      // Capítulo V: Transtornos mentais e comportamentais (F00-F99)
      { code: 'F00', description: 'Demência na doença de Alzheimer' },
      { code: 'F03', description: 'Demência não especificada' },
      {
        code: 'F10',
        description: 'Transtornos mentais e comportamentais devidos ao uso de álcool',
      },
      { code: 'F17', description: 'Transtornos mentais devidos ao uso de fumo (tabagismo)' },
      { code: 'F20', description: 'Esquizofrenia' },
      { code: 'F31', description: 'Transtorno afetivo bipolar' },
      { code: 'F32.0', description: 'Episódio depressivo leve' },
      { code: 'F32.1', description: 'Episódio depressivo moderado' },
      { code: 'F32.2', description: 'Episódio depressivo grave sem sintomas psicóticos' },
      { code: 'F33', description: 'Transtorno depressivo recorrente' },
      { code: 'F34.1', description: 'Distimia' },
      { code: 'F40', description: 'Transtornos fóbico-ansiosos' },
      { code: 'F41.0', description: 'Transtorno de pânico (ansiedade paroxística episódica)' },
      { code: 'F41.1', description: 'Ansiedade generalizada (TAG)' },
      { code: 'F41.2', description: 'Transtorno misto ansioso e depressivo' },
      { code: 'F42', description: 'Transtorno obsessivo-compulsivo (TOC)' },
      { code: 'F43.1', description: 'Estado de estresse pós-traumático (TEPT)' },
      { code: 'F45', description: 'Transtornos somatoformes' },
      { code: 'F50.0', description: 'Anorexia nervosa' },
      { code: 'F50.2', description: 'Bulimia nervosa' },
      { code: 'F51.0', description: 'Insônia não-orgânica' },
      { code: 'F84.0', description: 'Autismo infantil (TEA)' },
      { code: 'F90.0', description: 'Distúrbio da atividade e da atenção (TDAH)' },

      // Capítulo VI: Doenças do sistema nervoso (G00-G99)
      { code: 'G20', description: 'Doença de Parkinson' },
      { code: 'G30', description: 'Doença de Alzheimer' },
      { code: 'G35', description: 'Esclerose múltipla' },
      { code: 'G40.9', description: 'Epilepsia não especificada' },
      { code: 'G43', description: 'Enxaqueca' },
      { code: 'G43.0', description: 'Enxaqueca sem aura (enxaqueca comum)' },
      { code: 'G43.1', description: 'Enxaqueca com aura (enxaqueca clássica)' },
      { code: 'G44.2', description: 'Cefaleia de tensão' },
      { code: 'G47.0', description: 'Distúrbios do início e da manutenção do sono (insônia)' },
      { code: 'G47.3', description: 'Apneia de sono' },
      { code: 'G51.0', description: 'Paralisia de Bell (paralisia facial periférica)' },
      { code: 'G56.0', description: 'Síndrome do túnel do carpo' },

      // Capítulo VII e VIII: Olho e Ouvido (H00-H95)
      { code: 'H10', description: 'Conjuntivite' },
      { code: 'H16', description: 'Ceratite' },
      { code: 'H25', description: 'Catarata senil' },
      { code: 'H40.1', description: 'Glaucoma primário de ângulo aberto' },
      { code: 'H52.1', description: 'Miopia' },
      { code: 'H52.2', description: 'Astigmatismo' },
      { code: 'H52.4', description: 'Presbiopia' },
      { code: 'H60', description: 'Otite externa' },
      { code: 'H65', description: 'Otite média não-supurativa' },
      { code: 'H66', description: 'Otite média supurativa e a não especificada' },
      { code: 'H81.0', description: 'Doença de Menière' },
      { code: 'H81.1', description: 'Vertigem paroxística benigna' },
      { code: 'H90', description: 'Perda de audição por condução e neuro-sensorial' },
      { code: 'H93.1', description: 'Tinnitus (zumbido)' },

      // Capítulo IX: Doenças do aparelho circulatório (I00-I99)
      { code: 'I10', description: 'Hipertensão essencial (primária)' },
      { code: 'I11', description: 'Doença cardíaca hipertensiva' },
      { code: 'I12', description: 'Doença renal hipertensiva' },
      { code: 'I13', description: 'Doença cardíaca e renal hipertensiva' },
      { code: 'I15', description: 'Hipertensão secundária' },
      { code: 'I20.0', description: 'Angina instável' },
      { code: 'I21.9', description: 'Infarto agudo do miocárdio não especificado' },
      { code: 'I25.1', description: 'Doença isquêmica aterosclerótica do coração' },
      { code: 'I25.9', description: 'Doença isquêmica crônica do coração não especificada' },
      { code: 'I42', description: 'Cardiomiopatia' },
      { code: 'I47', description: 'Taquicardia paroxística' },
      { code: 'I48', description: 'Fibrilação e flutter atrial' },
      { code: 'I49', description: 'Outras arritmias cardíacas' },
      { code: 'I50.0', description: 'Insuficiência cardíaca congestiva' },
      { code: 'I50.9', description: 'Insuficiência cardíaca não especificada' },
      {
        code: 'I64',
        description: 'Acidente vascular cerebral, não especificado como hemorrágico ou isquêmico',
      },
      { code: 'I70', description: 'Aterosclerose' },
      { code: 'I73.0', description: 'Síndrome de Raynaud' },
      { code: 'I73.9', description: 'Doença vascular periférica não especificada' },
      { code: 'I83', description: 'Varizes dos membros inferiores' },
      { code: 'I84', description: 'Hemorroidas' },

      // Capítulo X: Doenças do aparelho respiratório (J00-J99)
      { code: 'J00', description: 'Nasofaringite aguda (resfriado comum)' },
      { code: 'J01', description: 'Sinusite aguda' },
      { code: 'J02', description: 'Faringite aguda' },
      { code: 'J03.9', description: 'Amigdalite aguda não especificada' },
      { code: 'J04', description: 'Laringite e traqueíte agudas' },
      { code: 'J06.9', description: 'Infecção aguda das vias aéreas superiores não especificada' },
      { code: 'J10', description: 'Influenza (gripe) devida a vírus identificado' },
      { code: 'J11', description: 'Influenza (gripe) devida a vírus não identificado' },
      { code: 'J12', description: 'Pneumonia viral' },
      { code: 'J15', description: 'Pneumonia bacteriana' },
      { code: 'J18.9', description: 'Pneumonia não especificada' },
      { code: 'J20.9', description: 'Bronquite aguda não especificada' },
      { code: 'J30', description: 'Rinite alérgica e vasomotora' },
      { code: 'J30.1', description: 'Rinite alérgica devida a pólen' },
      { code: 'J32', description: 'Sinusite crônica' },
      {
        code: 'J44.0',
        description: 'Doença pulmonar obstrutiva crônica (DPOC) com infecção respiratória aguda',
      },
      { code: 'J44.9', description: 'Doença pulmonar obstrutiva crônica não especificada' },
      { code: 'J45.0', description: 'Asma predominantemente alérgica' },
      { code: 'J45.1', description: 'Asma não-alérgica' },
      { code: 'J45.9', description: 'Asma não especificada' },

      // Capítulo XI: Doenças do aparelho digestivo (K00-K93)
      { code: 'K02', description: 'Cárie dentária' },
      { code: 'K05', description: 'Gengivite e doenças periodontais' },
      { code: 'K21.0', description: 'Doença de refluxo gastroesofágico com esofagite' },
      { code: 'K21.9', description: 'Doença de refluxo gastroesofágico sem esofagite' },
      { code: 'K25', description: 'Úlcera gástrica' },
      { code: 'K26', description: 'Úlcera duodenal' },
      { code: 'K29.0', description: 'Gastrite hemorrágica aguda' },
      { code: 'K29.7', description: 'Gastrite não especificada' },
      { code: 'K30', description: 'Dispepsia funcional' },
      { code: 'K35', description: 'Apendicite aguda' },
      { code: 'K40', description: 'Hérnia inguinal' },
      { code: 'K42', description: 'Hérnia umbilical' },
      { code: 'K44', description: 'Hérnia diafragmática / de hiato' },
      { code: 'K50', description: 'Doença de Crohn' },
      { code: 'K51', description: 'Colite ulcerativa' },
      { code: 'K57', description: 'Doença diverticular do intestino' },
      { code: 'K58', description: 'Síndrome do intestino irritável (SII)' },
      { code: 'K59.0', description: 'Constipação intestinal' },
      { code: 'K70', description: 'Doença alcoólica do fígado' },
      { code: 'K76.0', description: 'Esteatose hepática (fígado gorduroso)' },
      { code: 'K80', description: 'Colelitíase (pedra na vesícula)' },
      { code: 'K81', description: 'Colecistite' },

      // Capítulo XII: Doenças da pele e do tecido subcutâneo (L00-L99)
      { code: 'L02', description: 'Abscesso cutâneo, furúnculo e antraz' },
      { code: 'L03', description: 'Celulite infecciosa' },
      { code: 'L20.9', description: 'Dermatite atópica não especificada' },
      { code: 'L23', description: 'Dermatite alérgica de contato' },
      { code: 'L24', description: 'Dermatite de contato por irritantes' },
      { code: 'L29', description: 'Prurido' },
      { code: 'L30', description: 'Outras dermatites / eczema' },
      { code: 'L40.0', description: 'Psoríase vulgar' },
      { code: 'L50.0', description: 'Urticária alérgica' },
      { code: 'L70.0', description: 'Acne vulgar' },
      { code: 'L72', description: 'Cisto folicular da pele e do tecido subcutâneo' },
      { code: 'L80', description: 'Vitiligo' },
      { code: 'L82', description: 'Ceratose seborreica' },

      // Capítulo XIII: Doenças do sistema osteomuscular e do tecido conjuntivo (M00-M99)
      { code: 'M05', description: 'Artrite reumatoide soropositiva' },
      { code: 'M06.9', description: 'Artrite reumatoide não especificada' },
      { code: 'M10', description: 'Gota' },
      { code: 'M15.0', description: 'Poliartrose primária' },
      { code: 'M16', description: 'Coxartrose (artrose do quadril)' },
      { code: 'M17', description: 'Gonartrose (artrose do joelho)' },
      { code: 'M19.9', description: 'Artrose não especificada' },
      { code: 'M25.5', description: 'Dor articular' },
      { code: 'M40', description: 'Cifose e lordose' },
      { code: 'M41', description: 'Escoliose' },
      {
        code: 'M51.1',
        description: 'Transtornos de discos lombares e outros com radiculopatia (hérnia de disco)',
      },
      { code: 'M54.2', description: 'Cervicalgia' },
      { code: 'M54.5', description: 'Dor lombar baixa (lombalgia)' },
      { code: 'M65', description: 'Sinovite e tenossinovite' },
      { code: 'M75.1', description: 'Síndrome do manguito rotador' },
      { code: 'M77.1', description: 'Epicondilite lateral (cotovelo de tenista)' },
      { code: 'M79.1', description: 'Mialgia' },
      { code: 'M79.7', description: 'Fibromialgia' },
      { code: 'M81.0', description: 'Osteoporose pós-menopáusica' },
      { code: 'M81.9', description: 'Osteoporose não especificada' },

      // Capítulo XIV: Doenças do aparelho geniturinário (N00-N99)
      { code: 'N00', description: 'Síndrome nefrítica aguda' },
      { code: 'N04', description: 'Síndrome nefrótica' },
      { code: 'N17', description: 'Insuficiência renal aguda' },
      { code: 'N18.9', description: 'Doença renal crônica não especificada' },
      { code: 'N20.0', description: 'Calculose do rim (cálculo renal / nefrolitíase)' },
      { code: 'N20.1', description: 'Calculose do ureter' },
      { code: 'N23', description: 'Cólica nefrética não especificada' },
      { code: 'N30.0', description: 'Cistite aguda' },
      {
        code: 'N39.0',
        description: 'Infecção do trato urinário de localização não especificada (ITU)',
      },
      { code: 'N40', description: 'Hiperplasia benigna da próstata (HPB)' },
      { code: 'N41', description: 'Doenças inflamatórias da próstata (prostatite)' },
      { code: 'N76', description: 'Outras afecções inflamatórias da vagina e da vulva (vaginite)' },
      { code: 'N91', description: 'Menstruação ausente, escassa e pouco frequente (amenorreia)' },
      { code: 'N92', description: 'Menstruação excessiva, frequente e irregular' },
      { code: 'N94.6', description: 'Dismenorreia não especificada (cólica menstrual)' },
      { code: 'N95.1', description: 'Estados da menopausa e do climatério feminino' },

      // Capítulo XVIII: Sintomas, sinais e achados anormais (R00-R99)
      { code: 'R00.0', description: 'Taquicardia não especificada' },
      { code: 'R05', description: 'Tosse' },
      { code: 'R06.0', description: 'Dispneia (falta de ar)' },
      { code: 'R07.4', description: 'Dor torácica não especificada' },
      { code: 'R10.0', description: 'Abdome agudo' },
      { code: 'R10.4', description: 'Outras dores abdominais e as não especificadas' },
      { code: 'R11', description: 'Náusea e vômitos' },
      { code: 'R42', description: 'Tontura e instabilidade' },
      { code: 'R50.9', description: 'Febre não especificada' },
      { code: 'R51', description: 'Cefaleia' },
      { code: 'R53', description: 'Mal-estar e fadiga / astenia' },
      { code: 'R55', description: 'Síncope e colapso (desmaio)' },
      { code: 'R63.0', description: 'Anorexia (falta de apetite)' },
      {
        code: 'R73.0',
        description: 'Anormalidade do teste de tolerância à glicose (pré-diabetes)',
      },

      // Capítulo XXI: Fatores que influenciam o estado de saúde (Z00-Z99)
      { code: 'Z00.0', description: 'Exame médico geral de rotina / Check-up' },
      { code: 'Z01.0', description: 'Exame dos olhos e da visão' },
      { code: 'Z01.1', description: 'Exame dos ouvidos e da audição' },
      { code: 'Z01.2', description: 'Exame odontológico' },
      {
        code: 'Z13',
        description: 'Exame especial de rastreamento de transtornos não especificados',
      },
      { code: 'Z23', description: 'Necessidade de imunização contra doença bacteriana única' },
      { code: 'Z30', description: 'Anticoncepção e planejamento reprodutivo' },
      { code: 'Z34', description: 'Supervisão de gravidez normal (pré-natal)' },
      { code: 'Z76.0', description: 'Emissão de prescrição de repetição / renovação' },
    ]

    for (const c of cidList) {
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

    // 2. Catálogo abrangente e realista de Medicamentos com princípios ativos, laboratórios, apresentações e alertas de IA
    const medsList = [
      // Analgésicos e Anti-inflamatórios
      {
        name: 'Dipirona Monoidratada 1g',
        active_ingredient: 'Dipirona Monoidratada',
        laboratory: 'EMS',
        presentation: 'Comprimidos Efervescentes',
        indications: 'Dor moderada a intensa e febre refratária.',
        contraindications: 'Histórico de agranulocitose, porfiria hepática, gravidez 3º trimestre.',
        interactions:
          'Potencializa ação de anticoagulantes orais. Cuidado com álcool e ciclosporina.',
      },
      {
        name: 'Paracetamol 500mg',
        active_ingredient: 'Paracetamol',
        laboratory: 'Medley',
        presentation: 'Comprimidos',
        indications: 'Analgésico e antipirético em cefaleia, dores musculares e resfriados.',
        contraindications: 'Insuficiência hepática grave, alcoolismo crônico.',
        interactions:
          'Risco aumentado de hepatotoxicidade com carbamazepina, fenitoína e rifampicina.',
      },
      {
        name: 'Ibuprofeno 600mg',
        active_ingredient: 'Ibuprofeno',
        laboratory: 'Neo Química',
        presentation: 'Comprimidos Revestidos',
        indications: 'Dor inflamatória articular, dismenorreia, trauma muscular e febre.',
        contraindications:
          'Úlcera péptica ativa, sangramento gastrointestinal, insuficiência renal severa.',
        interactions:
          'Reduz efeito de anti-hipertensivos (IECA/BRA). Aumenta toxicidade de metotrexato e lítio.',
      },
      {
        name: 'Cetoprofeno 150mg',
        active_ingredient: 'Cetoprofeno',
        laboratory: 'Sanofi',
        presentation: 'Cápsulas de Liberação Prolongada',
        indications: 'Artrite, artrose, lombalgia, ciatalgia e processos inflamatórios agudos.',
        contraindications: 'Hipersensibilidade a AINEs, insuficiência cardíaca grave, gestação.',
        interactions:
          'Aumenta risco de hemorragia com anticoagulantes e antiagregantes plaquetários.',
      },
      {
        name: 'Nimesulida 100mg',
        active_ingredient: 'Nimesulida',
        laboratory: 'Eurofarma',
        presentation: 'Comprimidos',
        indications: 'Tratamento de curta duração de dores agudas e inflamação osteoarticular.',
        contraindications: 'Hepatotoxicidade prévia por nimesulida, úlcera péptica ativa.',
        interactions: 'Pode interagir com varfarina e reduzir a eficácia de diuréticos.',
      },
      {
        name: 'Celecoxibe 200mg',
        active_ingredient: 'Celecoxibe',
        laboratory: 'Pfizer',
        presentation: 'Cápsulas',
        indications: 'Osteoartrite, artrite reumatoide, espondilite anquilosante.',
        contraindications:
          'Alergia a sulfonamidas, doença isquêmica cardíaca estabelecida, AVC prévio.',
        interactions: 'Inibidores de CYP2C9 aumentam concentração. Risco renal com IECA/BRA.',
      },
      {
        name: 'Tramadol 50mg',
        active_ingredient: 'Cloridrato de Tramadol',
        laboratory: 'Aché',
        presentation: 'Cápsulas',
        indications: 'Dor moderada a intensa aguda e crônica.',
        contraindications:
          'Intoxicação aguda por depressores do SNC, uso de IMAO nos últimos 14 dias.',
        interactions:
          'Risco de síndrome serotoninérgica com ISRS e duloxetina. Depressão respiratória com sedativos.',
      },
      {
        name: 'Codeína + Paracetamol (30mg/500mg)',
        active_ingredient: 'Fosfato de Codeína + Paracetamol',
        laboratory: 'Cristália',
        presentation: 'Comprimidos',
        indications: 'Dores de intensidade moderada refratárias a analgésicos simples.',
        contraindications:
          'Depressão respiratória, asma aguda, metabolizadores ultrarrápidos de CYP2D6 em lactação.',
        interactions: 'Sedação profunda com benzodiazepínicos e álcool.',
      },

      // Sistema Cardiovascular e Anti-hipertensivos
      {
        name: 'Losartana Potássica 100mg',
        active_ingredient: 'Losartana Potássica',
        laboratory: 'Eurofarma',
        presentation: 'Comprimidos Revestidos',
        indications: 'Hipertensão arterial e proteção renal em nefropatia diabética.',
        contraindications: 'Gestação (2º e 3º trimestres), estenose arterial renal bilateral.',
        interactions:
          'AINEs reduzem efeito hipotensor. Risco de hipercalemia com suplementos de K+.',
      },
      {
        name: 'Valsartana 160mg',
        active_ingredient: 'Valsartana',
        laboratory: 'Novartis',
        presentation: 'Comprimidos Revestidos',
        indications: 'Hipertensão arterial sistêmica, insuficiência cardíaca crônica pós-IAM.',
        contraindications: 'Gravidez e lactação, uso concomitante com alisquireno em diabetes.',
        interactions:
          'Potencializa toxicidade do lítio. Monitorar eletrólitos com espironolactona.',
      },
      {
        name: 'Enalapril 20mg',
        active_ingredient: 'Maleato de Enalapril',
        laboratory: 'Medley',
        presentation: 'Comprimidos',
        indications: 'Hipertensão arterial e insuficiência cardíaca congestiva.',
        contraindications: 'Histórico de angioedema relacionado a IECA, gravidez.',
        interactions: 'Diuréticos poupadores de potássio aumentam risco de hipercalemia fatal.',
      },
      {
        name: 'Atenolol 50mg',
        active_ingredient: 'Atenolol',
        laboratory: 'AstraZeneca',
        presentation: 'Comprimidos',
        indications: 'Hipertensão arterial, angina pectoris, controle de arritmias ventriculares.',
        contraindications:
          'Bradicardia sinusal grave, bloqueio AV de 2º e 3º graus, choque cardiogênico.',
        interactions:
          'Bloqueadores de canais de cálcio (verapamil/diltiazem) aumentam risco de assistolia.',
      },
      {
        name: 'Metoprolol Succinato 50mg',
        active_ingredient: 'Succinato de Metoprolol',
        laboratory: 'AstraZeneca',
        presentation: 'Comprimidos de Liberação Controlada',
        indications:
          'Insuficiência cardíaca com fração de ejeção reduzida, hipertensão e taquicardia.',
        contraindications: 'Asma brônquica grave não controlada, bloqueio AV avançado.',
        interactions:
          'Fluoxetina e paroxetina aumentam níveis plasmáticos de metoprolol via CYP2D6.',
      },
      {
        name: 'Carvedilol 25mg',
        active_ingredient: 'Carvedilol',
        laboratory: 'Baldacci',
        presentation: 'Comprimidos',
        indications:
          'Insuficiência cardíaca congestiva, hipertensão arterial, disfunção ventricular.',
        contraindications:
          'DPOC descompensado, ICC descompensada classe IV necessitando inotrópicos IV.',
        interactions:
          'Aumenta concentração de digoxina. Risco de hipoglicemia mascarada em diabéticos.',
      },
      {
        name: 'Anlodipino 10mg',
        active_ingredient: 'Besilato de Anlodipino',
        laboratory: 'EMS',
        presentation: 'Comprimidos',
        indications: 'Hipertensão e coronariopatia crônica estável.',
        contraindications: 'Estenose aórtica crítica, choque cardiogênico, angina instável.',
        interactions:
          'Sinvastatina em doses > 20mg (aumenta risco de miopatia). Monitorar com ciclosporina.',
      },
      {
        name: 'Furosemida 40mg',
        active_ingredient: 'Furosemida',
        laboratory: 'Sanofi',
        presentation: 'Comprimidos',
        indications: 'Edema decorrente de insuficiência cardíaca, cirrose hepática e doença renal.',
        contraindications: 'Anúria, desidratação grave e hipocalemia acentuada.',
        interactions:
          'Aumenta ototoxicidade de aminoglicosídeos. Aumenta risco de intoxicação por digoxina.',
      },
      {
        name: 'Espironolactona 25mg',
        active_ingredient: 'Espironolactona',
        laboratory: 'Pfizer',
        presentation: 'Comprimidos',
        indications:
          'Hipertensão resistente, insuficiência cardíaca com FE reduzida, hiperaldosteronismo.',
        contraindications:
          'Hipercalemia (>5.0 mEq/L), insuficiência renal aguda ou TFG < 30 mL/min.',
        interactions: 'Associação com IECA/BRA exige controle sérico rigoroso de potássio.',
      },
      {
        name: 'Atorvastatina Cálcica 40mg',
        active_ingredient: 'Atorvastatina Cálcica',
        laboratory: 'Pfizer',
        presentation: 'Comprimidos Revestidos',
        indications: 'Hipercolesterolemia primária, prevenção de eventos cardiovasculares maiores.',
        contraindications:
          'Doença hepática ativa, elevações inexplicadas de transaminases, gravidez.',
        interactions:
          'Claritromicina e itraconazol aumentam exposição à estatina (risco de rabdomiólise).',
      },
      {
        name: 'Rosuvastatina Cálcica 20mg',
        active_ingredient: 'Rosuvastatina Cálcica',
        laboratory: 'AstraZeneca',
        presentation: 'Comprimidos Revestidos',
        indications: 'Redução de LDL-colesterol e triglicerídeos em alto risco aterosclerótico.',
        contraindications: 'Miopatia ativa, insuficiência renal severa, gravidez.',
        interactions: 'Antiácidos contendo alumínio e magnésio reduzem absorção.',
      },
      {
        name: 'Clopidogrel 75mg',
        active_ingredient: 'Bissulfato de Clopidogrel',
        laboratory: 'Sanofi',
        presentation: 'Comprimidos Revestidos',
        indications: 'Prevenção secundária de IAM, AVC isquêmico e síndrome coronariana aguda.',
        contraindications:
          'Hemorragia patológica ativa (úlcera péptica, hemorragia intracraniana).',
        interactions:
          'Omeprazol pode diminuir conversão ao metabólito ativo de clopidogrel (preferir pantoprazol).',
      },

      // Diabetes e Endocrinologia
      {
        name: 'Metformina 850mg (Glifage)',
        active_ingredient: 'Cloridrato de Metformina',
        laboratory: 'Merck',
        presentation: 'Comprimidos',
        indications: 'Tratamento de primeira linha de Diabetes Mellitus tipo 2 e pré-diabetes.',
        contraindications:
          'Insuficiência renal grave (TFG < 30 mL/min), acidose metabólica aguda, choque.',
        interactions:
          'Contrastes iodados requerem suspensão temporária 48h antes e após exame radiológico.',
      },
      {
        name: 'Metformina XR 500mg',
        active_ingredient: 'Cloridrato de Metformina',
        laboratory: 'Merck',
        presentation: 'Comprimidos de Ação Prolongada',
        indications:
          'Diabetes Mellitus tipo 2 com intolerância gástrica à formulação convencional.',
        contraindications:
          'Insuficiência renal crônica estágio 4 ou 5, insuficiência cardíaca descompensada.',
        interactions: 'Álcool em excesso aumenta risco de acidose lática.',
      },
      {
        name: 'Dapagliflozina 10mg (Forxiga)',
        active_ingredient: 'Dapagliflozina',
        laboratory: 'AstraZeneca',
        presentation: 'Comprimidos Revestidos',
        indications:
          'Diabetes Mellitus tipo 2, insuficiência cardíaca com FE reduzida e doença renal crônica.',
        contraindications: 'Hipersensibilidade, cetoacidose diabética.',
        interactions:
          'Pode potencializar efeito diurético de furosemida. Risco de hipoglicemia com insulina.',
      },
      {
        name: 'Empagliflozina 25mg (Jardiance)',
        active_ingredient: 'Empagliflozina',
        laboratory: 'Boehringer Ingelheim',
        presentation: 'Comprimidos Revestidos',
        indications:
          'DM2 e redução de risco cardiovascular em pacientes com doença aterosclerótica.',
        contraindications: 'TFG < 20 mL/min/1.73m², diálise.',
        interactions: 'Diuréticos aumentam risco de desidratação e hipotensão.',
      },
      {
        name: 'Semaglutida 1mg (Ozempic)',
        active_ingredient: 'Semaglutida',
        laboratory: 'Novo Nordisk',
        presentation: 'Caneta Injetável para Aplicação Semanal',
        indications: 'Controle glicêmico em DM2 e redução de eventos adversos cardiovasculares.',
        contraindications: 'Histórico pessoal ou familiar de carcinoma medular de tireoide, NEM-2.',
        interactions:
          'Retarda o esvaziamento gástrico, podendo alterar a taxa de absorção de fármacos orais.',
      },
      {
        name: 'Gliclazida MR 60mg',
        active_ingredient: 'Gliclazida',
        laboratory: 'Servier',
        presentation: 'Comprimidos de Liberação Modificada',
        indications: 'Diabetes tipo 2 quando medidas dietéticas forem insuficientes.',
        contraindications: 'Diabetes tipo 1, cetoacidose diabética, gravidez, porfiria.',
        interactions: 'Miconazol e fluconazol potencializam fortemente efeito hipoglicemiante.',
      },
      {
        name: 'Insulina Glargina 100 UI/mL (Lantus)',
        active_ingredient: 'Insulina Glargina',
        laboratory: 'Sanofi',
        presentation: 'Caneta / Refil de 3mL',
        indications:
          'Diabetes Mellitus tipos 1 e 2 necessitando de insulina basal de longa duração.',
        contraindications: 'Episódios de hipoglicemia grave.',
        interactions:
          'Beta-bloqueadores não seletivos podem mascarar sintomas de alarme de hipoglicemia.',
      },
      {
        name: 'Levotiroxina Sódica 100mcg',
        active_ingredient: 'Levotiroxina Sódica',
        laboratory: 'Merck',
        presentation: 'Comprimidos',
        indications: 'Terapia de reposição no hipotireoidismo primário e secundário.',
        contraindications: 'Insuficiência adrenal descompensada não tratada, tireotoxicose.',
        interactions:
          'Carbonato de cálcio, sulfato ferroso e antiácidos diminuem absorção se tomados juntos.',
      },

      // Sistema Gastrointestinal
      {
        name: 'Omeprazol 40mg',
        active_ingredient: 'Omeprazol Magnésico',
        laboratory: 'Aché',
        presentation: 'Cápsulas',
        indications:
          'Doença do refluxo gastroesofágico grave, esofagite erosiva, síndrome de Zollinger-Ellison.',
        contraindications: 'Hipersensibilidade a inibidores da bomba de prótons.',
        interactions:
          'Diminui biodisponibilidade de atazanavir e erlotinibe. Altera absorção de ferro.',
      },
      {
        name: 'Esomeprazol 40mg (Nexium)',
        active_ingredient: 'Esomeprazol Magnésico',
        laboratory: 'AstraZeneca',
        presentation: 'Comprimidos Revestidos',
        indications:
          'Refluxo gastroesofágico, cicatrização de úlcera gástrica associada ao uso de AINEs.',
        contraindications: 'Uso concomitante com nelfinavir.',
        interactions: 'Inibição de CYP2C19 (diazepam, citalopram).',
      },
      {
        name: 'Domperidona 10mg',
        active_ingredient: 'Domperidona',
        laboratory: 'Eurofarma',
        presentation: 'Comprimidos',
        indications: 'Náuseas, vômitos, plenitude pós-prandial e gastroparesia.',
        contraindications:
          'Prolongamento do intervalo QT, hemorragia gastrointestinal, prolactinoma.',
        interactions:
          'Inibidores potentes de CYP3A4 (claritromicina, cetoconazol) aumentam risco de arritmias.',
      },
      {
        name: 'Ondansetrona 8mg (Vonau Flash)',
        active_ingredient: 'Cloridrato de Ondansetrona',
        laboratory: 'Biolab',
        presentation: 'Comprimidos Dissolução Oral',
        indications: 'Prevenção e alívio de náuseas e vômitos pós-operatórios e em quimioterapia.',
        contraindications:
          'Uso concomitante com apomorfina (risco de hipotensão profunda e síncope).',
        interactions: 'Medicamentos que prolongam o intervalo QT.',
      },
      {
        name: 'Bromoprida 10mg',
        active_ingredient: 'Bromoprida',
        laboratory: 'EMS',
        presentation: 'Cápsulas',
        indications: 'Distúrbios da motilidade gastrointestinal e refluxo.',
        contraindications: 'Feocromocitoma, obstrução mecânica ou perfuração digestiva.',
        interactions: 'Potencializa sedação com depressores do sistema nervoso central.',
      },

      // Antibióticos e Antimicrobianos
      {
        name: 'Amoxicilina + Clavulanato de Potássio 875/125mg',
        active_ingredient: 'Amoxicilina + Ácido Clavulânico',
        laboratory: 'EMS',
        presentation: 'Comprimidos Revestidos',
        indications:
          'Sinusite bacteriana aguda, pneumonia comunitária, infecções de pele e partes moles.',
        contraindications:
          'Hipersensibilidade a penicilinas e beta-lactâmicos, icterícia colestática prévia.',
        interactions:
          'Probenecida diminui excreção renal da amoxicilina. Pode reduzir eficácia de anticoncepcionais.',
      },
      {
        name: 'Ciprofloxacino 500mg',
        active_ingredient: 'Cloridrato de Ciprofloxacino',
        laboratory: 'Bayer',
        presentation: 'Comprimidos Revestidos',
        indications:
          'Infecções do trato urinário complicadas, pielonefrite, prostatite e gastroenterite.',
        contraindications:
          'Hipersensibilidade a quinolonas, histórico de tendinopatia por fluoroquinolonas.',
        interactions:
          'Antiácidos e cálcio quelam o fármaco no TGI. Aumenta muito os níveis séricos de teofilina e tizanidina.',
      },
      {
        name: 'Levofloxacino 500mg',
        active_ingredient: 'Levofloxacino Hemidratado',
        laboratory: 'Sanofi',
        presentation: 'Comprimidos Revestidos',
        indications:
          'Pneumonia adquirida na comunidade, exacerbação bacteriana de DPOC, sinusite aguda.',
        contraindications: 'Miastenia gravis, prolongamento de QT, epilepsia.',
        interactions: 'Corticoides aumentam risco de ruptura do tendão de Aquiles.',
      },
      {
        name: 'Cefalexina 500mg',
        active_ingredient: 'Cefalexina Monoidratada',
        laboratory: 'Teuto',
        presentation: 'Drágeas / Cápsulas',
        indications:
          'Infecções de pele e anexos por Staphylococcus/Streptococcus, faringite bacteriana.',
        contraindications: 'Anafilaxia prévia a cefalosporinas.',
        interactions: 'Metformina pode ter eliminação renal diminuída com cefalexina.',
      },
      {
        name: 'Ceftriaxona 1g IV/IM',
        active_ingredient: 'Ceftriaxona Dissódica',
        laboratory: 'Roche',
        presentation: 'Frasco-Ampola para Injeção',
        indications:
          'Meningite bacteriana, sepse, pneumonia nosocomial, gonorreia, infecções intra-abdominais.',
        contraindications:
          'Recém-nascidos prematuros com hiperbilirrubinemia, administração simultânea de cálcio IV.',
        interactions: 'Soluções intravenosas contendo cálcio formam precipitados insolúveis.',
      },
      {
        name: 'Sulfametoxazol + Trimetoprima 800/160mg (Bactrim F)',
        active_ingredient: 'Sulfametoxazol + Trimetoprima',
        laboratory: 'Roche',
        presentation: 'Comprimidos',
        indications:
          'Tratamento de infecções urinárias e profilaxia de pneumonia por Pneumocystis jirovecii.',
        contraindications:
          'Deficiência grave de G6PD, anemia megaloblástica por deficiência de folato, insuficiência hepática.',
        interactions:
          'Potencializa o efeito anticoagulante da varfarina e a toxicidade de fenitoína.',
      },
      {
        name: 'Nitrofurantoína 100mg',
        active_ingredient: 'Nitrofurantoína',
        laboratory: 'Eurofarma',
        presentation: 'Cápsulas',
        indications:
          'Cistite aguda não complicada e profilaxia de infecções urinárias de repetição.',
        contraindications:
          'Insuficiência renal com clearance < 30 mL/min, gestação a termo (38-42 semanas).',
        interactions: 'Trissilicato de magnésio reduz a absorção gastrointestinal.',
      },
      {
        name: 'Fluconazol 150mg',
        active_ingredient: 'Fluconazol',
        laboratory: 'Pfizer',
        presentation: 'Cápsula Dose Única',
        indications: 'Candidíase vaginal aguda e recorrente, dermatomicoses, candidíase oral.',
        contraindications:
          'Coadministração com terfenadina ou cisaprida, prolongamento do intervalo QT.',
        interactions:
          'Inibidor de CYP2C9 e CYP3A4: eleva níveis de varfarina, sulfonilureias e estatinas.',
      },

      // Sistema Nervoso Central, Psiquiatria e Neurologia
      {
        name: 'Clonazepam 0.5mg',
        active_ingredient: 'Clonazepam',
        laboratory: 'Roche',
        presentation: 'Comprimidos Sublinguais / Orais',
        indications: 'Crises agudas de pânico, ansiedade grave, mioclonias.',
        contraindications:
          'Insuficiência respiratória grave, apneia obstrutiva do sono, glaucoma de ângulo fechado.',
        interactions:
          'Álcool e analgésicos opioides causam depressão respiratória potencialmente fatal.',
      },
      {
        name: 'Alprazolam 0.5mg',
        active_ingredient: 'Alprazolam',
        laboratory: 'Pfizer',
        presentation: 'Comprimidos',
        indications: 'Transtorno de ansiedade e transtorno do pânico.',
        contraindications: 'Miastenia gravis, insuficiência hepática severa.',
        interactions: 'Cetoconazol e itraconazol inibem fortemente o clearance de alprazolam.',
      },
      {
        name: 'Zolpidem 10mg',
        active_ingredient: 'Hemitartarato de Zolpidem',
        laboratory: 'Sanofi',
        presentation: 'Comprimidos Revestidos',
        indications: 'Tratamento de curto prazo da insônia ocasional e transitória.',
        contraindications:
          'Apneia obstrutiva do sono, insuficiência respiratória aguda, histórico de sonambulismo complexo.',
        interactions:
          'Potencialização de sonolência diurna com antidepressivos sedativos e álcool.',
      },
      {
        name: 'Fluoxetina 20mg',
        active_ingredient: 'Cloridrato de Fluoxetina',
        laboratory: 'Eli Lilly',
        presentation: 'Cápsulas',
        indications: 'Depressão maior, bulimia nervosa, transtorno disfórico pré-menstrual (TDPM).',
        contraindications:
          'Uso simultâneo com IMAO (aguardar 5 semanas após suspensão de fluoxetina).',
        interactions:
          'Forte inibição de CYP2D6; aumenta níveis de metoprolol, haloperidol e risperidona.',
      },
      {
        name: 'Duloxetina 60mg (Cymbalta)',
        active_ingredient: 'Cloridrato de Duloxetina',
        laboratory: 'Eli Lilly',
        presentation: 'Cápsulas Liberação Retardada',
        indications:
          'Depressão, dor neuropática periférica diabética, fibromialgia e dor musculoesquelética crônica.',
        contraindications:
          'Hepatopatia ativa, glaucoma de ângulo fechado não controlado, uso com IMAO.',
        interactions:
          'Ciprofloxacino aumenta concentração de duloxetina. Risco de sangramento com AINEs e AAS.',
      },
      {
        name: 'Venlafaxina 75mg XR',
        active_ingredient: 'Cloridrato de Venlafaxina',
        laboratory: 'Pfizer',
        presentation: 'Cápsulas de Liberação Prolongada',
        indications: 'Transtorno depressivo maior, TAG, fobia social e transtorno de pânico.',
        contraindications: 'Uso concomitante com IMAO, hipertensão arterial não controlada.',
        interactions: 'Risco de síndrome serotoninérgica com triptanos e tramadol.',
      },
      {
        name: 'Pregabalina 75mg',
        active_ingredient: 'Pregabalina',
        laboratory: 'Pfizer',
        presentation: 'Cápsulas',
        indications:
          'Dor neuropática periférica e central em adultos, fibromialgia, transtorno de ansiedade generalizada.',
        contraindications: 'Hipersensibilidade aos componentes.',
        interactions: 'Potencializa efeitos sedativos de lorazepam e oxicodona.',
      },
      {
        name: 'Gabapentina 300mg',
        active_ingredient: 'Gabapentina',
        laboratory: 'Pfizer',
        presentation: 'Cápsulas',
        indications: 'Neuralgia pós-herpética, dor neuropática e epilepsia refratária.',
        contraindications: 'Hipersensibilidade ao princípio ativo.',
        interactions: 'Antiácidos reduzem biodisponibilidade em até 20%.',
      },

      // Sistema Respiratório e Antialérgicos
      {
        name: 'Salbutamol Spray 100mcg/dose',
        active_ingredient: 'Sulfato de Salbutamol',
        laboratory: 'GSK',
        presentation: 'Aerossol Dosimetrado (Bombinha)',
        indications: 'Alívio rápido do broncoespasmo na asma, bronquite e DPOC.',
        contraindications: 'Ameaça de aborto no primeiro ou segundo trimestre.',
        interactions: 'Beta-bloqueadores não seletivos (propranolol) bloqueiam a broncodilatação.',
      },
      {
        name: 'Budesonida + Formoterol 400/12mcg (Symbicort)',
        active_ingredient: 'Budesonida + Fumarato de Formoterol',
        laboratory: 'AstraZeneca',
        presentation: 'Inalador Turbuhaler',
        indications: 'Tratamento de manutenção e alívio da asma e DPOC moderada a grave.',
        contraindications:
          'Tirotoxicose grave não tratada, arritmias ventriculares não controladas.',
        interactions:
          'Cetoconazol aumenta os níveis plasmáticos de budesonida por inibição de CYP3A4.',
      },
      {
        name: 'Budesonida Spray Nasal 64mcg',
        active_ingredient: 'Budesonida',
        laboratory: 'AstraZeneca',
        presentation: 'Frasco Spray com 120 Doses',
        indications: 'Rinite alérgica sazonal e perene, pólipos nasais.',
        contraindications:
          'Infecções fúngicas ou virais das vias aéreas superiores sem tratamento específico.',
        interactions: 'Inibidores fortes de CYP3A4 podem aumentar a exposição sistêmica.',
      },
      {
        name: 'Loratadina 10mg',
        active_ingredient: 'Loratadina',
        laboratory: 'Schering-Plough / Bayer',
        presentation: 'Comprimidos',
        indications:
          'Alívio dos sintomas de rinite alérgica (espirros, coriza, prurido) e urticária crônica.',
        contraindications: 'Insuficiência hepática grave sem ajuste de dose.',
        interactions: 'Sem sedação significativa em doses recomendadas. Cuidado com eritromicina.',
      },
      {
        name: 'Desloratadina 5mg',
        active_ingredient: 'Desloratadina',
        laboratory: 'EMS',
        presentation: 'Comprimidos Revestidos',
        indications: 'Rinite alérgica persistente e urticária idiopática.',
        contraindications: 'Hipersensibilidade à desloratadina ou loratadina.',
        interactions: 'Não interfere na condução motora ou psicomotora.',
      },
      {
        name: 'Fexofenadina 180mg (Allegra)',
        active_ingredient: 'Cloridrato de Fexofenadina',
        laboratory: 'Sanofi',
        presentation: 'Comprimidos Revestidos',
        indications: 'Rinite alérgica e urticária idiopática crônica em adultos.',
        contraindications: 'Hipersensibilidade.',
        interactions: 'Antiácidos com hidróxido de alumínio e magnésio reduzem absorção em 50%.',
      },
    ]

    for (const m of medsList) {
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

    // 3. Garantir dados demo enriquecidos e vinculados a médicos, pacientes e clínicas
    try {
      const demoDoctor = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.medico@resulta.med')
      const demoClinic = app.findAuthRecordByEmail('_pb_users_auth_', 'demo.clinica@resulta.med')
      const patRecords = app.findRecordsByFilter('patients', 'name != ""', '-created', 10, 0)

      if (patRecords && patRecords.length > 0 && demoDoctor) {
        const apptCol = app.findCollectionByNameOrId('appointments')
        const today = new Date()

        // Criar consultas demo distribuídas pelos próximos e últimos dias
        const apptOffsets = [
          {
            days: 0,
            hour: '08:30',
            status: 'confirmada',
            reason: 'Consulta de Rotina e Hipertensão',
          },
          {
            days: 0,
            hour: '10:00',
            status: 'confirmada',
            reason: 'Avaliação de Exames Laboratoriais',
          },
          {
            days: 0,
            hour: '11:30',
            status: 'em_andamento',
            reason: 'Check-up Clínico e Rinite Alérgica',
          },
          { days: 0, hour: '14:00', status: 'agendada', reason: 'Acompanhamento Diabetes Tipo 2' },
          {
            days: 0,
            hour: '15:30',
            status: 'agendada',
            reason: 'Teleconsulta - Ajuste de Medicação',
          },
          { days: 0, hour: '16:45', status: 'agendada', reason: 'Dor lombar e ciatalgia' },
          { days: 1, hour: '09:00', status: 'agendada', reason: 'Avaliação Pré-operatória' },
          { days: 1, hour: '10:30', status: 'agendada', reason: 'Retorno Cardiológico' },
          { days: 2, hour: '14:30', status: 'agendada', reason: 'Check-up Geral' },
          {
            days: -1,
            hour: '09:00',
            status: 'finalizada',
            reason: 'Consulta Finalizada - Asma e Alergia',
          },
          {
            days: -2,
            hour: '11:00',
            status: 'finalizada',
            reason: 'Retorno Hipertensão e Dislipidemia',
          },
          {
            days: -3,
            hour: '15:00',
            status: 'finalizada',
            reason: 'Acompanhamento Gastrointestinal',
          },
        ]

        for (let idx = 0; idx < apptOffsets.length; idx++) {
          const item = apptOffsets[idx]
          const pat = patRecords[idx % patRecords.length]
          const targetDate = new Date(today.getTime() + item.days * 86400000)
          const dateStr = targetDate.toISOString().slice(0, 10)
          const fullDateTime = `${dateStr}T${item.hour}:00.000Z`

          // Verificar se já existe consulta nesse horário
          try {
            app.findFirstRecordByData('appointments', 'date_time', fullDateTime)
          } catch (_) {
            const appt = new Record(apptCol)
            appt.set('doctor', demoDoctor.id)
            appt.set('patient', pat.id)
            appt.set('date_time', fullDateTime)
            appt.set('status', item.status)
            appt.set('reason', item.reason)
            appt.set(
              'notes',
              `Consulta registrada na unidade central da ${demoClinic.getString('name') || 'Clínica Resulta'}.`,
            )
            try {
              app.save(appt)
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
  },
  (app) => {},
)
