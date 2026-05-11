export default function Loading() {
  return (
    <div style={{minHeight:"100vh",backgroundColor:"#ea580c",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,sans-serif"}}>
      <div style={{fontSize:"52px",marginBottom:"16px"}}>🎓</div>
      <div style={{color:"#fff",fontWeight:"900",fontSize:"24px",marginBottom:"6px"}}>companion</div>
      <div style={{color:"rgba(255,255,255,0.7)",fontSize:"13px",marginBottom:"32px",letterSpacing:"1px",textTransform:"uppercase"}}>AI Study Assistant</div>
      <div style={{display:"flex",gap:"8px"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:"8px",height:"8px",borderRadius:"50%",backgroundColor:"rgba(255,255,255,0.6)",animation:"pulse 1.4s ease-in-out "+i*0.2+"s infinite"}}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}
