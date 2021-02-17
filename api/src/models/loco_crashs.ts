import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель по неплановым ремонтам
*/

export interface ILocoCrashs {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<ILocoCrashs & Document>('loco_crashs', entrySchema);