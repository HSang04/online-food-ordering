import React, { useState, useEffect } from 'react';
import './TrangChu.css';

import img1 from '../../../assets/images/trangchu1.jpg';
import img2 from '../../../assets/images/trangchu2.jpg';
import img3 from '../../../assets/images/trangchu3.jpg';

const TrangChu = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Hương vị tuyệt vời",
      subtitle: "Khám phá thế giới ẩm thực đa dạng với hơn 1000+ món ăn ngon",
      image: img1
    },
    {
      title: "Giao hàng nhanh chóng",
      subtitle: "Đặt hàng online - Giao tận nơi trong 30 phút",
      image: img2
    },
    {
      title: "Chất lượng đảm bảo",
      subtitle: "100% nguyên liệu tươi ngon, an toàn thực phẩm",
      image: img3
    }
  ];

  const features = [
    { icon: "⚡", title: "Giao hàng nhanh", desc: "Giao trong 30 phút" },
    { icon: "🏆", title: "Chất lượng cao", desc: "Nguyên liệu tươi ngon" },
    { icon: "🚚", title: "Miễn phí ship", desc: "Đơn hàng từ 200k" },
    { icon: "⭐", title: "Đánh giá 5 sao", desc: "Hơn 10,000+ review" }
  ];

  const categories = [
    { name: "Món Việt", image: "🍜", desc: "Phở, bún, cơm truyền thống" },
    { name: "Fast Food", image: "🍔", desc: "Burger, pizza, gà rán" },
    { name: "Đồ uống", image: "🧋", desc: "Trà sữa, cà phê, nước ép" },
    { name: "Tráng miệng", image: "🍰", desc: "Bánh ngọt, kem, chè" },
    { name: "Món chay", image: "🥗", desc: "Healthy, organic" }
  ];

  const testimonials = [
    {
      name: "Trần Quốc Phong",
      rating: 5,
      comment: "Đồ ăn ngon, giao hàng nhanh, sẽ order lại!",
      avatar: "👨"
    },
    {
      name: "Tô Quốc Bình",
      rating: 5,
      comment: "Chất lượng tuyệt vời, giá cả hợp lý",
      avatar: "👩"
    },
    {
      name: "Nguyễn Đăng Khôi",
      rating: 4,
      comment: "Web dễ sử dụng, đa dạng món ăn",
      avatar: "👱‍♂️"
    }
  ];

  
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, []); 

 
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="trang-chu">
   
      <section className="hero">
        <div
          className="hero-slide"
          style={{
            backgroundImage: `url(${heroSlides[currentSlide].image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="hero-overlay"></div>
          <div className="container">
            <div className="hero-content">
              <h2 className="hero-title">{heroSlides[currentSlide].title}</h2>
              <p className="hero-subtitle">{heroSlides[currentSlide].subtitle}</p>
              <button className="btn-hero">
                Khám phá ngay <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="slide-indicators">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

  
      <section className="features">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    
      <section className="categories">
        <div className="container">
          <div className="section-header">
            <h2>Danh mục món ăn</h2>
            <p>Khám phá hương vị đa dạng từ khắp nơi</p>
          </div>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <div key={index} className="category-card">
                <div className="category-image">{category.image}</div>
                <h3>{category.name}</h3>
                <p>{category.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>Khách hàng nói gì?</h2>
            <p>Những phản hồi chân thực từ khách hàng</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="avatar">{testimonial.avatar}</div>
                  <div className="user-info">
                    <h4>{testimonial.name}</h4>
                    <div className="rating">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="comment">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default TrangChu;