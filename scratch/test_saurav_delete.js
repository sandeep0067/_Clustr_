
async function testSauravDelete() {
    const baseUrl = 'http://localhost:5000/api/posts';
    
    try {
        console.log('1. Creating the "Saurav" post...');
        const createRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authorId: 'test-author-id',
                content: 'Hello i love big',
                postType: 'interested'
            })
        });
        
        const post = await createRes.json();
        const postId = post.id || post._id;
        console.log('   Post created with ID:', postId);
        
        console.log('\n2. Deleting the post via API...');
        const deleteRes = await fetch(`${baseUrl}/${postId}`, {
            method: 'DELETE'
        });
        
        console.log('   Delete response status:', deleteRes.status);
        
        const getRes = await fetch(baseUrl);
        const posts = await getRes.json();
        const found = posts.find(p => (p.id || p._id) === postId);
        
        if (!found) {
            console.log('\nSUCCESS: Post deleted successfully!');
        } else {
            console.log('\nFAILURE: Post still exists.');
        }
    } catch (err) {
        console.error('Test error:', err.message);
    }
}

testSauravDelete();
