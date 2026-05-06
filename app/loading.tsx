export default function Loading() {
  return (
    <div style={{
      minHeight:"100vh",
      backgroundColor:"#ea580c",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    }}>
      <div style={{
        width:"90px",
        height:"90px",
        borderRadius:"24px",
        background:"rgba(255,255,255,0.2)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        fontSize:"52px",
        marginBottom:"20px",
        boxShadow:"0 8px 32px rgba(0,0,0,0.2)"
      }}>🎓</div>
      <div style={{color:"#fff",fontSize:"28px",fontWeight:"900",letterSpacing:"-0.5px"}}>companion</div>
      <div style={{color:"rgba(255,255,255,0.7)",fontSize:"13px",marginTop:"6px",letterSpacing:"2px",textTransform:"uppercase"}}>AI Study Assistant</div>
      <div style={{marginTop:"40px",display:"flex",gap:"8px"}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:"8px",height:"8px",borderRadius:"50%",backgroundColor:"rgba(255,255,255,0.6)",animation:`pulse 1.4s ease-in-out ${i*0.2}s infinite`}} />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
