import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель НСИ по депо
*/

export interface INSIDepo {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<INSIDepo & Document>('nsi_depos', entrySchema);