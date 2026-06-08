const fs = require('fs');
let file = fs.readFileSync('src/pages/Index.tsx', 'utf8');
file = file.replace(
  '<div className="flex items-center justify-center md:justify-end gap-4">',
  '<div className="flex items-center justify-center md:justify-end gap-4 relative"><span onClick={() => (window as any).findRickRollNumber?.(5)} className="absolute -bottom-8 right-0 text-[8px] opacity-5 cursor-pointer select-none">5</span>'
);
fs.writeFileSync('src/pages/Index.tsx', file);
console.log("Done");
