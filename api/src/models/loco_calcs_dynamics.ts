import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель по ресурсам локомотива
*/

export interface ILocoCalcsDynamics {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });
entrySchema.index({ DATE: -1 });

export default mongoose.model<ILocoCalcsDynamics & Document>('loco_calcs_dynamics', entrySchema);