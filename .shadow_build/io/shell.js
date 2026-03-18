import { execSync } from "child_process";
export const shell = {
    exec: (cmd) => execSync(cmd, { encoding: 'utf-8' })
};
