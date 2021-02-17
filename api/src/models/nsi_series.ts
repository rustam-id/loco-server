import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель НСИ по сериям
*/

export interface INSISeries {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<INSISeries & Document>('nsi_series', entrySchema);