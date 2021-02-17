import mongoose from 'mongoose';
import { Db } from 'mongodb';
const keys = require('../config/keys')
require('../models/nsi_roads');
require('../models/calcResult');
require('../models/crews_data');
require('../models/crews_predicts');
require('../models/nsi_columns');
require('../models/nsi_crews');
require('../models/nsi_depos');
require('../models/nsi_multes');
require('../models/nsi_sections');
require('../models/nsi_series');
require('../models/nsi_preds');
require('../models/calcResult');
require('../models/crews_trips');
require('../models/loco_cards');
require('../models/loco_crashs');
require('../models/loco_calcs_dynamics');
require('../models/loco_devices');
require('../models/loco_equips');
require('../models/loco_errs');
require('../models/loco_predicts');
require('../models/crews_predicts_aggrs');
require('../models/crews_predicts_dynmc');
require('../models/crews_predicts_stat');
require('../models/nsi_columns');
require('../models/life_cycles');
require('../models/stats_entries_datas');
require('../models/crews_1_reports');

export default async (): Promise<Db> => {
    const connection = await mongoose.connect(keys.mongo.mongoURL, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    });
    return connection.connection.db;
};