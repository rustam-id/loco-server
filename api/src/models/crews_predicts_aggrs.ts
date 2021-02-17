import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель с аргрегированными прогнозами по бригадам
*/

export interface ICrewsPredictAggr {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ICrewsPredictAggr & Document>('crews_predicts_aggr', entrySchema);