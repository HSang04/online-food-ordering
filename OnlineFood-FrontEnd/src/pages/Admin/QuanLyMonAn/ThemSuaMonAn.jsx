import React, { useEffect, useState } from 'react';
import axios from "../../../services/axiosInstance";
import { useNavigate, useParams } from 'react-router-dom';
import './ThemSuaMonAn.css';

const ThemSuaMonAn = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const jwt = localStorage.getItem('jwt');

  const [form, setForm] = useState({
    tenMonAn: '',
    gia: '',
    moTa: '',
    danhMuc: '',
    trangThai: '1',
  });
  
  const [khuyenMai, setKhuyenMai] = useState({
    giaGiam: "",
    thoiHan: "",
    hasThoiHan: false, 
  });
  const [danhMucs, setDanhMucs] = useState([]);
  const [images, setImages] = useState([]); // Ảnh mới được chọn
  const [previews, setPreviews] = useState([]); // Preview ảnh mới
  const [oldImages, setOldImages] = useState([]); // Ảnh cũ từ DB
  const [originalImages, setOriginalImages] = useState([]); // Lưu ảnh gốc để khôi phục
  const [deletedImageIds, setDeletedImageIds] = useState([]); // ID các ảnh cần xóa
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [khuyenMaiEnabled, setKhuyenMaiEnabled] = useState(false);

  useEffect(() => {
    const fetchDanhMucs = async () => {
      try {
        const res = await axios.get('/danh-muc', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        setDanhMucs(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy danh mục:', err);
        setError('Không thể tải danh mục');
      }
    };

    fetchDanhMucs();
  }, [jwt]);

  useEffect(() => {
    if (id) {
      const fetchMonAn = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`/mon-an/${id}`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          const monAn = res.data;
          console.log('MonAn data from server:', monAn);
          console.log('TrangThai value:', monAn.trangThai, typeof monAn.trangThai);
          
          setForm({
            tenMonAn: monAn.tenMonAn || '',
            gia: monAn.gia || '',
            moTa: monAn.moTa || '',
            danhMuc: monAn.danhMuc?.id || '',
            trangThai: monAn.trangThai?.toString() || '1',
          });
          // Đảm bảo oldImages là một mảng và có đầy đủ thông tin
          const images = monAn.hinhAnhMonAns || [];
          setOldImages(images);
          setOriginalImages(images); 

           if (monAn.khuyenMai) {
            setKhuyenMaiEnabled(true);
            setKhuyenMai({
              giaGiam: monAn.khuyenMai.giaGiam || '',
              thoiHan: monAn.khuyenMai.thoiHan
                ? monAn.khuyenMai.thoiHan.slice(0, 16)
                : '',
              hasThoiHan: !!monAn.khuyenMai.thoiHan,
            });
          } else {
              setKhuyenMaiEnabled(false);
              setKhuyenMai({ giaGiam: '', thoiHan: '' });
            }
        } catch (err) {
          console.error('Lỗi khi tải món ăn:', err);
          setError('Không thể tải thông tin món ăn');
        } finally {
          setLoading(false);
        }
      };
      fetchMonAn();
    }
  }, [id, jwt]);

  useEffect(() => {
    const imageUrls = images.map((file) => URL.createObjectURL(file));
    setPreviews(imageUrls);
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);


  const formatDateTime = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  return dateTimeLocal.includes(':00') ? dateTimeLocal : dateTimeLocal + ':00';
};
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // Clear error khi user nhập liệu
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveNewImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleRemoveOldImage = (imageId) => {
    // Thêm vào danh sách xóa thay vì xóa ngay lập tức
    setDeletedImageIds(prev => [...prev, imageId]);
    setOldImages(prevImages => prevImages.filter(img => img.id !== imageId));
  };

  const handleRestoreOldImage = (imageId) => {
    // Khôi phục ảnh đã đánh dấu xóa
    setDeletedImageIds(prev => prev.filter(id => id !== imageId));
    const imageToRestore = originalImages.find(img => img.id === imageId);
    if (imageToRestore) {
      setOldImages(prev => [...prev, imageToRestore]);
    }
  };



  const handleClearAllImages = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả ảnh không?')) {
      setImages([]);
      if (oldImages.length > 0) {
        setDeletedImageIds(oldImages.map(img => img.id));
        setOldImages([]);
      }
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // Validation trước khi gửi
    if (!form.tenMonAn.trim()) {
      setError('Tên món ăn không được để trống');
      setLoading(false);
      return;
    }
    
    if (!form.danhMuc) {
      setError('Vui lòng chọn danh mục');
      setLoading(false);
      return;
    }
    
    if (!form.gia || parseFloat(form.gia) <= 0) {
      setError('Giá phải lớn hơn 0');
      setLoading(false);
      return;
    }

    const keptImageIds = oldImages.map((img) => img.id);

    // Cả POST và PUT đều expect danhMuc object
    const dataToSend = {
      tenMonAn: form.tenMonAn.trim(),
      gia: parseFloat(form.gia),
      moTa: form.moTa.trim(),
      danhMuc: { id: parseInt(form.danhMuc) }, // Cả MonAn và MonAnDTO đều expect DanhMuc object
      trangThai: parseInt(form.trangThai),
    };

    // Chỉ thêm keptImageIds khi đang sửa (PUT) vì MonAnDTO có field này
    if (id) {
      dataToSend.keptImageIds = keptImageIds;
    }

    console.log('Data to send:', dataToSend);

    // Debug logging
    console.log('Form data to send:', form);
    console.log('Images count:', images.length);
    console.log('Old images count:', oldImages.length);

    const formData = new FormData();
    
    // Backend expect JSON string với key "monAn"
    formData.append("monAn", JSON.stringify(dataToSend));
    
    // Backend expect MultipartFile[] với key "images" 
    if (images.length > 0) {
      images.forEach((img, index) => {
        console.log(`Adding image ${index}:`, img.name, img.type, img.size);
        formData.append("images", img); // Tất cả file dùng cùng key "images"
      });
    }

    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, {
          name: value.name,
          type: value.type,
          size: value.size
        });
      } else {
        console.log(`${key}:`, value);
      }
    }

    let monAnId;

    // Debug: Log request details
    console.log('Request URL:', id ? `/mon-an/${id}` : '/mon-an');
    console.log('Request method:', id ? 'PUT' : 'POST');

    if (id) {
      const response = await axios.put(`/mon-an/${id}`, formData, {
        headers: { 
          Authorization: `Bearer ${jwt}`
          // Không set Content-Type, để browser tự động set cho FormData
        },
      });
      console.log('PUT response:', response);
      monAnId = id;
    } else {
      const response = await axios.post("/mon-an", formData, {
        headers: { 
          Authorization: `Bearer ${jwt}`
          // Không set Content-Type, để browser tự động set cho FormData
        },
      });
      console.log('POST response:', response);
      monAnId = response.data.id;
    }

    // 👉 Chỉ xử lý khuyến mãi nếu đang sửa món ăn
    if (id) {
      const coKhuyenMai = khuyenMaiEnabled && khuyenMai.giaGiam && parseFloat(khuyenMai.giaGiam) > 0;
      const coThoiHan = khuyenMai.hasThoiHan && khuyenMai.thoiHan;

      if (coKhuyenMai) {
        if (parseFloat(khuyenMai.giaGiam) >= parseFloat(form.gia)) {
          setError("Giá khuyến mãi phải nhỏ hơn giá gốc.");
          setLoading(false);
          return;
        }

        if (khuyenMai.hasThoiHan && !khuyenMai.thoiHan) {
          setError("Vui lòng chọn thời hạn dừng khuyến mãi.");
          setLoading(false);
          return;
        }
      }

      let khuyenMaiCu = null;
      const monAnRes = await axios.get(`/mon-an/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      khuyenMaiCu = monAnRes.data?.khuyenMai;

      if (khuyenMaiCu && !coKhuyenMai) {
        await axios.delete(`/khuyen-mai/${monAnId}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
      } else if (!khuyenMaiCu && coKhuyenMai) {
        await axios.post(
          "/khuyen-mai",
          {
            monAnId,
            giaGiam: parseFloat(khuyenMai.giaGiam),
            thoiHan: coThoiHan ? formatDateTime(khuyenMai.thoiHan) : null,
          },
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
      } else if (khuyenMaiCu && coKhuyenMai) {
        await axios.put(
          `/khuyen-mai/${monAnId}`,
          {
            monAnId,
            giaGiam: parseFloat(khuyenMai.giaGiam),
            thoiHan: coThoiHan ? formatDateTime(khuyenMai.thoiHan) : null,
          },
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
      }
    }

    navigate("/quan-ly-mon-an");

  } catch (err) {
    console.error("Lỗi khi lưu món ăn:", err);
    console.error("Error response:", err.response);
    console.error("Error response data:", err.response?.data);
    console.error("Error response status:", err.response?.status);
    
    let errorMessage = 'Có lỗi xảy ra khi lưu món ăn';
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.response?.data) {
      // Nếu response.data là string
      errorMessage = typeof err.response.data === 'string' ? err.response.data : errorMessage;
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};





  if (loading && id) {
    return (
      <div className="them-sua-mon-an">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
     <div className="them-sua-mon-an-wrapper">
    <div className="them-sua-mon-an">
      <h2>{id ? 'Sửa' : 'Thêm'} Món Ăn</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div>
          <label>Tên món:</label>
          <input
            type="text"
            name="tenMonAn"
            value={form.tenMonAn}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Danh mục:</label>
          <select
            name="danhMuc"
            value={form.danhMuc}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn danh mục --</option>
            {danhMucs.map((dm) => (
              <option key={dm.id} value={dm.id}>
                {dm.tenDanhMuc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Giá:</label>
          <input
            type="number"
            name="gia"
            value={form.gia}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        {/* Chi hien thi khuyen mai khi edit */}
        {id && (
          <>
            <div className="form-group">
              <label>Khuyến mãi:</label>
              <div>
                <label>
                  <input
                    type="radio"
                    name="khuyenMaiOption"
                    checked={!khuyenMaiEnabled}
                    onChange={() => setKhuyenMaiEnabled(false)}
                  /> Không áp dụng
                </label>
                <label style={{ marginLeft: "20px" }}>
                  <input
                    type="radio"
                    name="khuyenMaiOption"
                    checked={khuyenMaiEnabled}
                    onChange={() => setKhuyenMaiEnabled(true)}
                  /> Áp dụng khuyến mãi
                </label>
              </div>
            </div>

            {khuyenMaiEnabled && (
              <>
                <div className="form-group">
                  <label>Giá khuyến mãi:</label>
                  <input
                    type="number"
                    className="form-control"
                    value={khuyenMai.giaGiam}
                    onChange={(e) =>
                      setKhuyenMai({ ...khuyenMai, giaGiam: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Thời hạn:</label>
                  <div>
                    <label>
                      <input
                        type="radio"
                        name="thoiHanOption"
                        checked={!khuyenMai.hasThoiHan}
                        onChange={() =>
                          setKhuyenMai((prev) => ({
                            ...prev,
                            hasThoiHan: false,
                            thoiHan: '',
                          }))
                        }
                      /> Không thời hạn
                    </label>
                    <label style={{ marginLeft: '20px' }}>
                      <input
                        type="radio"
                        name="thoiHanOption"
                        checked={khuyenMai.hasThoiHan}
                        onChange={() =>
                          setKhuyenMai((prev) => ({
                            ...prev,
                            hasThoiHan: true,
                          }))
                        }
                      /> Có thời hạn
                    </label>
                  </div>
                </div>

                {khuyenMai.hasThoiHan && (
                  <div className="form-group">
                    <label>Chọn thời hạn dừng khuyến mãi:</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={khuyenMai.thoiHan}
                      onChange={(e) =>
                        setKhuyenMai({ ...khuyenMai, thoiHan: e.target.value })
                      }
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div>
          <label>Mô tả:</label>
          <textarea
            name="moTa"
            value={form.moTa}
            onChange={handleChange}
            rows="4"
          />
        </div>

        
        <div>
          <label>Trạng thái:</label>
          <select
            name="trangThai"
            value={form.trangThai}
            onChange={handleChange}
            required
          >
            <option value="1">Đang bán</option>
            <option value="2">Ngừng bán</option>
          </select>
        </div>

    
        {oldImages.length > 0 && (
          <div className="image-section">
            <label>Ảnh hiện tại ({oldImages.length} ảnh):</label>
            <div className="preview-container">
              {oldImages.map((img, index) => (
                <div key={img.id || index} className="preview-image-wrapper old-image">
                  <img 
                    src={img.duongDan} 
                    alt={`Ảnh ${index + 1}`} 
                    className="preview-image" 
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg'; // Ảnh placeholder nếu lỗi
                    }}
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveOldImage(img.id)}
                    title="Xóa ảnh này"
                  >
                    ×
                  </button>
                  <div className="image-label">Ảnh cũ</div>
                </div>
              ))}
            </div>
          </div>
        )}

     
        {deletedImageIds.length > 0 && (
          <div className="image-section deleted-images">
            <label>Ảnh sẽ bị xóa ({deletedImageIds.length} ảnh):</label>
            <div className="preview-container">
              {deletedImageIds.map((imageId) => {
                const deletedImage = originalImages.find(img => img.id === imageId);
                return deletedImage ? (
                  <div key={imageId} className="preview-image-wrapper deleted-image">
                    <img 
                      src={deletedImage.duongDan} 
                      alt="Ảnh sẽ xóa" 
                      className="preview-image deleted" 
                    />
                    <button
                      type="button"
                      className="restore-btn"
                      onClick={() => handleRestoreOldImage(imageId)}
                      title="Khôi phục ảnh này"
                    >
                      ↶
                    </button>
                    <div className="image-label">Sẽ xóa</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

  
        <div className="image-section">
          <label>
            Thêm ảnh mới (có thể chọn nhiều):
            {images.length > 0 && ` (${images.length} ảnh đã chọn)`}
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
          
          {previews.length > 0 && (
            <div className="preview-container">
              {previews.map((src, index) => (
                <div key={index} className="preview-image-wrapper new-image">
                  <img src={src} alt={`Ảnh mới ${index + 1}`} className="preview-image" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveNewImage(index)}
                    title="Xóa ảnh này"
                  >
                    ×
                  </button>
                  <div className="image-label">Ảnh mới</div>
                </div>
              ))}
            </div>
          )}
        </div>

      
        {(images.length > 0 || oldImages.length > 0) && (
          <div className="image-actions">
            <button
              type="button"
              className="clear-all-btn"
              onClick={handleClearAllImages}
            >
              Xóa tất cả ảnh
            </button>
          </div>
        )}

   
        <div className="image-summary">
          <p>
            <strong>Sau khi cập nhật sẽ có:</strong> {oldImages.length + images.length} ảnh
            {oldImages.length > 0 && (
              <span className="current-count"> ({oldImages.length} ảnh hiện tại</span>
            )}
            {images.length > 0 && (
              <span className="new-count"> + {images.length} ảnh mới</span>
            )}
            {(oldImages.length > 0 || images.length > 0) && <span>)</span>}
            {deletedImageIds.length > 0 && (
              <span className="deleted-count"> - {deletedImageIds.length} ảnh đã xóa</span>
            )}
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={loading ? "loading" : ""}
        >
          {loading ? 'Đang xử lý...' : (id ? 'Cập nhật' : 'Thêm mới')}
        </button>
      </form>
    </div>
    </div>
  );
};

export default ThemSuaMonAn;