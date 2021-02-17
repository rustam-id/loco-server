import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель с аргрегированными прогнозами по бригадам
*/

export interface ICrewsPredictStat {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICrewsPredictStat & Document>('crews_predicts_stat', entrySchema);