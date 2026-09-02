import type { Parameter } from '../../../../../RTD/index.js';
import type { Input as Context } from '../../../../../io.js';
export interface Component {
    get: (context: Context, parameters: Parameter[]) => string;
}
