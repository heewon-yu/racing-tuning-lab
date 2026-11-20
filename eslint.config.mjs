import { globalIgnores } from 'eslint/config';
import { defineConfig } from 'eslint/config';
export default defineConfig([globalIgnores(['.next/**','out/**','next-env.d.ts'])]);
