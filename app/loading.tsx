export default function Loading() {
  return (
    <div style={{
      minHeight:"100vh", backgroundColor:"#ea580c",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    }}>
      {/* Real logo — not emoji */}
      <img
        src="/icon-192.png"
        alt="Companion"
        width={80}
        height={80}
        style={{ borderRadius:"22px", marginBottom:"20px", boxShadow:"0 8px 32px rgba(0,0,0,0.25)" }}
      />
      <div style={{ color:"#fff", fontWeight:"900", fontSize:"26px", marginBottom:"6px", letterSpacing:"-0.5px" }}>
        companion
      </div>
      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"13px", marginBottom:"36px", letterSpacing:"1px", textTransform:"uppercase" }}>
        AI JAMB Study Assistant
      </div>
      <div style={{ display:"flex", gap:"8px" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:"8px", height:"8px", borderRadius:"50%",
            backgroundColor:"rgba(255,255,255,0.6)",
            animation:`pulse 1.4s ease-in-out ${i*0.2}s infinite`
          }}/>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );
}
