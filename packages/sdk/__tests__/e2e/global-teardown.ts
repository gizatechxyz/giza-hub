import * as path from 'path';
import * as fs from 'fs';

export default function globalTeardown(): void {
  const stateFile = path.resolve(
    __dirname,
    '.e2e-state.json',
  );
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
}
