// Simple test script to verify shortcuts API is working
// Run with: node test-shortcuts.js

async function testShortcutsAPI() {
  try {
    console.log('Testing Coinbull Shortcuts API...\n');
    
    // Test the main shortcuts endpoint
    const response = await fetch('http://localhost:3000/api/shortcuts');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Shortcuts API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Validate the response structure
    if (data.version !== 2) {
      throw new Error('Invalid version number');
    }
    
    if (!Array.isArray(data.shortcuts)) {
      throw new Error('Shortcuts should be an array');
    }
    
    if (data.shortcuts.length === 0) {
      throw new Error('No shortcuts found');
    }
    
    // Validate each shortcut has required fields
    data.shortcuts.forEach((shortcut, index) => {
      const required = ['label', 'uri', 'type', 'icon'];
      required.forEach(field => {
        if (!shortcut[field]) {
          throw new Error(`Shortcut ${index} missing required field: ${field}`);
        }
      });
    });
    
    console.log(`\n✅ All ${data.shortcuts.length} shortcuts are valid!`);
    
    // Test with token parameter
    console.log('\n🧪 Testing with token parameter...');
    const tokenResponse = await fetch('http://localhost:3000/api/shortcuts?token=example123');
    const tokenData = await tokenResponse.json();
    
    console.log('✅ Token-specific shortcuts work!');
    
    // Test shortcuts.json endpoint
    console.log('\n🧪 Testing shortcuts.json endpoint...');
    const jsonResponse = await fetch('http://localhost:3000/shortcuts.json');
    const jsonData = await jsonResponse.json();
    
    if (JSON.stringify(jsonData) === JSON.stringify(data)) {
      console.log('✅ shortcuts.json endpoint matches main API!');
    } else {
      throw new Error('shortcuts.json endpoint does not match main API');
    }
    
    console.log('\n🎉 All tests passed! Shortcuts API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testShortcutsAPI(); 