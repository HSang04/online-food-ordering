package com.ths.onlinefood.repository;
import com.ths.onlinefood.model.DanhGiaMonAn;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DanhGiaMonAnRepository extends JpaRepository<DanhGiaMonAn, Long> {
    
   
    List<DanhGiaMonAn> findByMonAnId(Long monAnId);

    Optional<DanhGiaMonAn> findByMonAnIdAndNguoiDungId(Long monAnId, Long nguoiDungId);
    

    @Query("SELECT d FROM DanhGiaMonAn d WHERE d.monAn.id = :monAnId")
    List<DanhGiaMonAn> findByMonAnIdOrderByCustom(@Param("monAnId") Long monAnId, Sort sort);
    
   
    long countByMonAnId(Long monAnId);
    
 
    @Query("SELECT AVG(d.soSao) FROM DanhGiaMonAn d WHERE d.monAn.id = :monAnId")
    Double findAverageRatingByMonAnId(@Param("monAnId") Long monAnId);
}