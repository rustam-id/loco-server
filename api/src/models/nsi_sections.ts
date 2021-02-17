import mongoose, { Schema, Document } from 'mongoose';

/* 
    модель НСИ по секциям
*/

export interface INSISections {
}

const entrySchema = new Schema({
    any: Schema.Types.Mixed
}, { strict: false });

export default mongoose.model<INSISections & Document>('nsi_sections', entrySchema);