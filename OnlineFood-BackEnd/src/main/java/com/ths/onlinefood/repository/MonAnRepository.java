package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.MonAn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;

public interface MonAnRepository extends JpaRepository<MonAn, Long> {
    List<MonAn> findByTenMonAnContainingIgnoreCase(String keyword);
   @EntityGraph(attributePaths = {"hinhAnhMonAns", "khuyenMai"})
    Optional<MonAn> findWithHinhAnhMonAnsAndKhuyenMaiById(Long id);

    
 
}
