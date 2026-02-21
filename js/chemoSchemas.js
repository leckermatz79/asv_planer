window.CHEMO_SCHEMAS = {
  "EC_q2w": {
    "label": "EC q2w",
    "zyklus_tage": 14,
    "anzahl_zyklen": 4,
    "default_gcsf": true,
    "events": [
      { "type": "therapy", "drug": "Epirubicin", "short": "E", "day": 1 },
      { "type": "therapy", "drug": "Cyclophosphamid", "short": "C", "day": 1 },
      { "type": "lab", "label": "Labor", "day": 8 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 }
    ]
  },
  "EC_q3w": {
    "label": "EC q3w",
    "zyklus_tage": 21,
    "anzahl_zyklen": 4,
    "events": [
      { "type": "therapy", "drug": "Epirubicin", "short": "E", "day": 1 },
      { "type": "therapy", "drug": "Cyclophosphamid", "short": "C", "day": 1 },
      { "type": "lab", "label": "Labor", "day": 8 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 }
    ]
  },
  "Paclitaxel_qw": {
    "label": "Paclitaxel wöchentlich",
    "zyklus_tage": 7,
    "anzahl_zyklen": 12,
    "events": [
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac", "day": 1 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 }
    ]
  },
  "Paclitaxel_Pembro_q3w": {
    "label": "Paclitaxel qw, Pembrolizumab q3w",
    "zyklus_tage": 21,
    "anzahl_zyklen": 4,
    "events": [
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac", "day": 1 },    
      { "type": "therapy", "drug": "Pembrolizumab", "short": "Pem", "day": 1 },      
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac", "day": 8 },
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac","day": 15 },         
      { "type": "lab", "label": "Labor", "fasting": true, "workdays_before_next_cycle_start": 2 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 7 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 12 }
    ]
  },
  "EC_Pembro_q3w": {
    "label": "EC-Pembrolizumab q3w",
    "zyklus_tage": 21,
    "anzahl_zyklen": 4,
    "events": [
      { "type": "therapy", "drug": "Epirubicin", "short": "E", "day": 1 },
      { "type": "therapy", "drug": "Cyclophosphamid", "short": "C", "day": 1 },
      { "type": "therapy", "drug": "Pembrolizumab", "short": "Pem", "day": 1 },      
      { "type": "lab", "label": "Labor", "day": 8 },
      { "type": "lab", "label": "Labor", "fasting": true, "workdays_before_next_cycle_start": 2 }
    ]
  },
  "TCbHP_q3w": {
    "label": "TCbHP: Docetaxel, Carboplatin, Trastuzumab, Pertuzumab q3w",
    "zyklus_tage": 21,
    "anzahl_zyklen": 6,
    "default_gcsf": true,
    "events": [
      { "type": "therapy", "drug": "Docetaxel", "short": "T", "day": 1 },    
      { "type": "therapy", "drug": "Carboplatin", "short": "Cb", "day": 1 },      
      { "type": "therapy", "drug": "Trastuzumab", "short": "Her", "day": 1 },
      { "type": "therapy", "drug": "Pertuzumab", "short": "Per", "day": 1 },     
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 },
      { "type": "lab", "label": "Labor", "day": 8 }
    ]
  },
  "Paclitaxel_Tratuzumab_Pertuzumab_q3w": {
    "label": "Paclitaxel wöchentlich, Trastuzumab + Pertuzumab alle 3 Wochen",
    "zyklus_tage": 21,
    "anzahl_zyklen": 4,
    "events": [
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac", "day": 1 },    
      { "type": "therapy", "drug": "Trastuzumab", "short": "Her", "day": 1 },
      { "type": "therapy", "drug": "Pertuzumab", "short": "Per", "day": 1 },  
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac", "day": 8 },
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac", "day": 15 },         
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 7 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 12 }
    ]
  },
  "APT": {
    "label": "APT (Paclitaxel, Trastuzumab qw)",
    "zyklus_tage": 7,
    "anzahl_zyklen": 12,
    "events": [
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac", "day": 1 },
      { "type": "therapy", "drug": "Trastuzumab", "short": "Her", "day": 1 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 }
    ]
  },
  "PORTEC-3 Teil 1": {
    "label": "PORTEC-3 Teil 1 (Cisplatin q3w + Radiatio)",
    "zyklus_tage": 21,
    "anzahl_zyklen": 2,
    "default_gcsf": false,
    "events": [
      { "type": "therapy", "drug": "Cisplatin", "short": "Cis", "day": 1 },
      { "type": "lab", "label": "Labor", "day": 8 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 }
    ]
  },
  "PORTEC-3 Teil 2": {
    "label": "PORTEC-3 Teil 2 (Carboplatin + Paclitaxel q3w)",
    "zyklus_tage": 21,
    "anzahl_zyklen": 4,
    "events": [
      { "type": "therapy", "drug": "Carboplatin", "short": "Cb", "day": 1 },
      { "type": "therapy", "drug": "Paclitaxel", "short": "Pac", "day": 1 },
      { "type": "lab", "label": "Labor", "day": 8 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 }
    ]
  },
  "nab-Paclitaxel / Atezolizumab": {
    "label": "nab-Paclitaxel / Atezolizumab",
    "zyklus_tage": 28,
    "anzahl_zyklen": 4,
    "events": [
      { "type": "therapy", "drug": "Nab-Paclitaxel", "short": "nab-Pac", "day": 1 },
      { "type": "therapy", "drug": "Atezolizumab", "short": "Atezo", "day": 1 },
      { "type": "therapy", "drug": "Nab-Paclitaxel", "short": "nab-Pac", "day": 8 },
      { "type": "therapy", "drug": "Nab-Paclitaxel", "short": "nab-Pac", "day": 15 },
      { "type": "therapy", "drug": "Atezolizumab", "short": "Atezo", "day": 15 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 17 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 12, "fasting": true },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 7 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2, "fasting": true}
    ]
  },
  "Pembrolizumab postneoadjuvant": {
    "label": "Pembrolizumab post-neoadjuvant",
    "zyklus_tage": 21,
    "anzahl_zyklen": 9,
    "events": [
      { "type": "therapy", "drug": "Pembrolizumab", "short": "Pembro", "day": 1 },
      { "type": "lab", "label": "Labor", "day": 8 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 , "fasting": true }
    ]
  },
  "T-DM1 postneoadjuvant": {
    "label": "T-DM1 postneoadjuvant",
    "zyklus_tage": 21,
    "anzahl_zyklen": 14,
    "events": [
      { "type": "therapy", "drug": "T-DM1", "short": "T-DM1", "day": 1 },
      { "type": "lab", "label": "Labor", "day": 8 },
      { "type": "lab", "label": "Labor", "workdays_before_next_cycle_start": 2 }
    ]
  }  
};
