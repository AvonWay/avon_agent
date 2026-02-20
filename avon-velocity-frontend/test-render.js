// Quick smoke test — run with: node test-render.js
import { render } from 'velocityjs';

const template = `#set($name = "Velocity Engine")Hello from $name! Status: OK`;
const result = render(template, {});
console.log('Result:', result);
console.log(result.includes('Velocity Engine') ? '✅ PASS' : '❌ FAIL');
