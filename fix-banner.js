const fs = require('fs');

let c = fs.readFileSync('app/page.tsx', 'utf8');

if (!c.includes('TodayStudyBanner')) {
  // Add the import
  c = c.replace(
    'import InstallBanner from "./components/InstallBanner";',
    'import InstallBanner from "./components/InstallBanner";\nimport TodayStudyBanner from "./components/TodayStudyBanner";'
  );

  // Add the component usage
  c = c.replace(
    '{/* Streak section */}',
    `{/* Today study task */}\n        <TodayStudyBanner darkMode={darkMode} />\n\n        {/* Streak section */}`
  );

  fs.writeFileSync('app/page.tsx', c);
  console.log('✅ Done - Banner added');
} else {
  console.log('✅ Already added');
}
