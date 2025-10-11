package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.HinhAnhMonAn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HinhAnhMonAnRepository extends JpaRepository<HinhAnhMonAn, Long> {
    List<HinhAnhMonAn> findByMonAnId(Long monAnId);
}
