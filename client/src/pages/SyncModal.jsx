import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { CloudUpload, X, CheckCircle, AlertTriangle } from 'lucide-react';

const SyncModal = ({ onClose }) => {
    const [status, setStatus] = useState('scanning'); // scanning, uploading, success, error
    const [message, setMessage] = useState('Escanea el Código QR que aparece en la Web Pública.');
    const [errorMsg, setErrorMsg] = useState('');
    const [isConflict, setIsConflict] = useState(false);
    const [lastQrData, setLastQrData] = useState(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        const html5QrcodeScanner = new Html5QrcodeScanner("reader", config, false);
        scannerRef.current = html5QrcodeScanner;

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, []);

    const onScanSuccess = async (decodedText, decodedResult) => {
        try {
            // Stop scanning immediately
            if (scannerRef.current) {
                await scannerRef.current.clear();
            }
            
            setStatus('uploading');
            setMessage('Código leído. Prestando el archivo local a la Nube...');
            
            const qrData = JSON.parse(decodedText);
            setLastQrData(qrData);
            
            if (!qrData.ip || !qrData.session_id) {
                throw new Error('El Código QR no tiene el formato correcto de SAWALIFE.');
            }

            // Llamar al local server para que él haga la subida
            const response = await axios.post('/system/sync-upload-to-cloud', {
                ip: qrData.ip,
                port: qrData.port,
                session_id: qrData.session_id
            });

            if (response.data.success) {
                // Guardamos los datos de la web en localStorage para permitir la Descarga luego
                localStorage.setItem('sync_active_session', JSON.stringify({ ip: qrData.ip, port: qrData.port, session_id: qrData.session_id }));
                setStatus('success');
                setMessage('La base de datos fue enviada a la nube con éxito. La web pública ahora controla los datos.');
            } else {
                throw new Error('Error al confirmar la subida.');
            }

        } catch (error) {
            setStatus('error');
            console.error(error);
            if (error.response && error.response.data && error.response.data.error) {
                setErrorMsg("La Nube dice: " + error.response.data.error);
                // Si la Nube bloquea por sesión y el status es 409 o 400 (depende de tu web backend)
                setIsConflict(true);
            } else {
                setErrorMsg(error.message || 'Ocurrió un error inesperado al escanear/subir.');
                setIsConflict(false);
            }
        }
    };

    const handleForceUpload = async () => {
        setStatus('uploading');
        setMessage('Forzando subida e ignorando sesión abandonada previa...');
        try {
            const response = await axios.post('/system/sync-upload-to-cloud', {
                ...lastQrData, force: true
            });
            if (response.data.success) {
                localStorage.setItem('sync_active_session', JSON.stringify({ ip: lastQrData.ip, port: lastQrData.port, session_id: lastQrData.session_id }));
                setStatus('success');
                setMessage('Base de datos forzada y enviada con éxito. La web ahora controla los datos.');
            }
        } catch (error) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Falló la subida forzada.');
        }
    };

    const handleResumeAbandoned = async () => {
        setStatus('uploading');
        setMessage('Rescatando la base de datos olvidada en la nube...');
        try {
            const response = await axios.post('/system/sync-download-from-cloud', {
                ...lastQrData, resume: true
            });
            if (response.data.success) {
                alert('¡Atención! Has recuperado las ventas abandonadas de la jornada anterior con éxito.');
                window.location.reload();
            }
        } catch (error) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Falló el rescate. Quizás el archivo ya no existe.');
        }
    };

    const onScanFailure = (error) => {
        // ignore background scan failures
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div className="glass-card" style={{ width: '400px', maxWidth: '100%', background: 'white', padding: '20px', textAlign: 'center' }}>
                <div className="flex-between" style={{ marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CloudUpload size={24} /> Conectar a la Web
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#555' }}>
                        <X size={24} />
                    </button>
                </div>

                {status === 'scanning' && (
                    <>
                        <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '10px' }}>{message}</p>
                        <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '10px' }}></div>
                    </>
                )}

                {status === 'uploading' && (
                    <div style={{ padding: '40px 0' }}>
                        <CloudUpload size={60} color="#0052D4" />
                        <h4 style={{ color: '#0052D4', marginTop: '20px' }}>{message}</h4>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ padding: '40px 0' }}>
                        <CheckCircle size={60} color="green" />
                        <h4 style={{ color: 'green', marginTop: '20px' }}>{message}</h4>
                        <button onClick={onClose} className="btn-primary" style={{ marginTop: '20px', background: 'green' }}>Finalizar y Cerrar</button>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ padding: '30px 0' }}>
                        <AlertTriangle size={60} color="red" />
                        <h4 style={{ color: 'red', marginTop: '15px' }}>Operación Rechazada</h4>
                        <p style={{ color: '#333', fontWeight: 'bold' }}>{errorMsg}</p>
                        
                        {isConflict ? (
                            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button onClick={handleResumeAbandoned} className="btn-primary" style={{ background: '#0052D4', padding: '10px' }}>
                                    📥 Recuperar Sesión Abandonada
                                </button>
                                <button onClick={handleForceUpload} className="btn-primary" style={{ background: '#d32f2f', padding: '10px' }}>
                                    ⚠️ Forzar Subida (Perder Abandono)
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => { setStatus('scanning'); setIsConflict(false); }} className="btn-primary" style={{ marginTop: '15px', marginRight: '10px', background: '#555' }}>
                                Reintentar QR
                            </button>
                        )}
                        <button onClick={onClose} className="btn-primary" style={{ marginTop: '15px', background: 'gray', width: '100%' }}>Cancelar</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyncModal;
